defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerServiceTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.ChatPlugins.ChatPluginService
  alias Pomoroom.ChatPlugins.PomodoroTimer.{PomodoroTimerRepository, PomodoroTimerService}
  alias Pomoroom.{PrivateChats, Users}

  defp register(nickname) do
    {:ok, user} =
      Users.register_user(%{
        email: "#{nickname}@h.es",
        nickname: nickname,
        password: "password_1",
        password_confirmation: "password_1"
      })

    user
  end

  defp chat_with_pomodoro do
    {chat_id, _timer_id} = chat_with_pomodoro_timer()
    chat_id
  end

  defp chat_with_pomodoro_timer do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {:ok, plugin} = ChatPluginService.install_plugin(chat.chat_id, "private", "pomodoro")

    {chat.chat_id, plugin.id}
  end

  test "reports a missing plugin when the chat has no pomodoro installed" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    assert PomodoroTimerService.get_state(chat.chat_id, "private") ==
             {:error, :plugin_not_installed}
  end

  test "starts in the work mode, stopped, with the default duration" do
    chat_id = chat_with_pomodoro()

    {:ok, payload} = PomodoroTimerService.get_state(chat_id, "private")

    assert payload.state.mode == "work"
    assert payload.state.is_running == false
    assert payload.state.time_left == 25 * 60
  end

  test "starts the timer and marks it as running" do
    chat_id = chat_with_pomodoro()

    {:ok, payload} = PomodoroTimerService.start(chat_id, "private")

    assert payload.state.is_running == true
    assert payload.state.started_at != nil
  end

  test "starting an already running timer is idempotent" do
    chat_id = chat_with_pomodoro()

    {:ok, _first} = PomodoroTimerService.start(chat_id, "private")
    {:ok, second} = PomodoroTimerService.start(chat_id, "private")

    assert second.state.is_running == true
  end

  test "pauses a running timer and keeps the remaining time" do
    chat_id = chat_with_pomodoro()

    {:ok, _started} = PomodoroTimerService.start(chat_id, "private")
    {:ok, paused} = PomodoroTimerService.pause(chat_id, "private")

    assert paused.state.is_running == false
    assert paused.state.time_left <= 25 * 60
  end

  test "pausing an already stopped timer is a no-op" do
    chat_id = chat_with_pomodoro()

    {:ok, paused} = PomodoroTimerService.pause(chat_id, "private")

    assert paused.state.is_running == false
  end

  test "resets a timer back to its initial work state" do
    chat_id = chat_with_pomodoro()

    {:ok, _started} = PomodoroTimerService.start(chat_id, "private")
    {:ok, reset} = PomodoroTimerService.reset(chat_id, "private")

    assert reset.state.mode == "work"
    assert reset.state.is_running == false
    assert reset.state.time_left == 25 * 60
    assert reset.state.cycles_completed == 0
  end

  test "switches mode while stopped" do
    chat_id = chat_with_pomodoro()

    {:ok, switched} = PomodoroTimerService.set_mode(chat_id, "private", "shortBreak")

    assert switched.state.mode == "shortBreak"
    assert switched.state.time_left == 5 * 60
  end

  test "rejects an invalid mode" do
    chat_id = chat_with_pomodoro()

    assert PomodoroTimerService.set_mode(chat_id, "private", "not_a_mode") ==
             {:error, :invalid_mode}
  end

  test "ignores a mode switch while the timer is running" do
    chat_id = chat_with_pomodoro()

    {:ok, _started} = PomodoroTimerService.start(chat_id, "private")
    {:ok, unchanged} = PomodoroTimerService.set_mode(chat_id, "private", "shortBreak")

    assert unchanged.state.mode == "work"
  end

  test "updates the timer configuration and resets the runtime state" do
    chat_id = chat_with_pomodoro()

    {:ok, updated} =
      PomodoroTimerService.update_config(chat_id, "private", %{
        work_duration: 30,
        short_break_duration: 10,
        long_break_duration: 20,
        cycles_before_long_break: 3
      })

    assert updated.config.work_duration == 30
    assert updated.state.time_left == 30 * 60
  end

  test "rejects an invalid configuration" do
    chat_id = chat_with_pomodoro()

    assert PomodoroTimerService.update_config(chat_id, "private", %{
             work_duration: 0,
             short_break_duration: 5,
             long_break_duration: 15,
             cycles_before_long_break: 4
           }) == {:error, :invalid_config}
  end

  test "deletes the underlying timer document for a chat" do
    {chat_id, timer_id} = chat_with_pomodoro_timer()

    :ok = PomodoroTimerService.delete_timer_for_chat(chat_id, "private")

    assert PomodoroTimerRepository.get_by_timer_id(timer_id) == {:error, :not_found}
  end
end
