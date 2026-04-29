defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.Runtime do
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository
  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerServer

  def ensure_pomodoro_plugin_started(timer_id, chat_id, chat_type) do
    case Registry.lookup(Registry.PomodoroPluginTimer, timer_id) do
      [] ->
        case DynamicSupervisor.start_child(
               Pomoroom.ChatPlugins.PomodoroTimerSupervisor,
               {PomodoroTimerServer,
                %{timer_id: timer_id, chat_id: chat_id, chat_type: chat_type}}
             ) do
          {:ok, _pid} -> {:ok, timer_id}
          {:error, {:already_started, _pid}} -> {:ok, timer_id}
          {:error, reason} -> {:error, reason}
        end

      _ ->
        {:ok, timer_id}
    end
  end

  def delete_timer(timer_id, chat_id, chat_type, plugin_id) do
    PomodoroTimerRepository.delete_by_chat(chat_id, chat_type, plugin_id)

    case Registry.lookup(Registry.PomodoroPluginTimer, timer_id) do
      [{pid, _value}] ->
        DynamicSupervisor.terminate_child(Pomoroom.ChatPlugins.PomodoroTimerSupervisor, pid)

      [] ->
        :ok
    end

    :ok
  end
end
