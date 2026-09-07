defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerNotifierTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerNotifier
  alias Pomoroom.Chats.Runtime.{ChatServer, Runtime}
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

  defp chat_with_server do
    user1 = register("notif_user1")
    user2 = register("notif_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    :ok = Runtime.ensure_chat_server_exists(chat.chat_id)

    chat.chat_id
  end

  test "sends a chat message when the work timer finishes" do
    chat_id = chat_with_server()

    {:ok, _} =
      PomodoroTimerNotifier.timer_finished(%{chat_id: chat_id, last_completed_mode: "work"})

    [message] = ChatServer.get_messages(chat_id)
    assert message.from_user == "pomodoro"
    assert message.text =~ "trabajo"
  end

  test "sends a chat message when a short break finishes" do
    chat_id = chat_with_server()

    {:ok, _} =
      PomodoroTimerNotifier.timer_finished(%{chat_id: chat_id, last_completed_mode: "shortBreak"})

    [message] = ChatServer.get_messages(chat_id)
    assert message.text =~ "descanso corto"
  end

  test "sends a chat message when a long break finishes" do
    chat_id = chat_with_server()

    {:ok, _} =
      PomodoroTimerNotifier.timer_finished(%{chat_id: chat_id, last_completed_mode: "longBreak"})

    [message] = ChatServer.get_messages(chat_id)
    assert message.text =~ "descanso largo"
  end

  test "does nothing when there is no completed mode yet" do
    chat_id = chat_with_server()

    assert PomodoroTimerNotifier.timer_finished(%{chat_id: chat_id, last_completed_mode: nil}) ==
             :ok

    assert ChatServer.get_messages(chat_id) == []
  end

  test "honors an explicit locale on the state" do
    chat_id = chat_with_server()

    {:ok, _} =
      PomodoroTimerNotifier.timer_finished(%{
        chat_id: chat_id,
        last_completed_mode: "work",
        locale: "es"
      })

    [message] = ChatServer.get_messages(chat_id)
    assert message.text =~ "trabajo"
  end
end
