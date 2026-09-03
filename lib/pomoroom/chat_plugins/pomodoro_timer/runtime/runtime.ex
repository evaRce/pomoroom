defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.Runtime do
  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerServer

  def ensure_timer_process_started(process_id, chat_id, chat_type, timer_id) do
    case Registry.lookup(Registry.PomodoroPluginTimer, process_id) do
      [] ->
        start_timer_child(process_id, chat_id, chat_type, timer_id)

      [{pid, _value}] ->
        case PomodoroTimerServer.get_state(process_id) do
          {:ok, %{timer_id: ^timer_id}} ->
            {:ok, process_id}

          _ ->
            DynamicSupervisor.terminate_child(Pomoroom.ChatPlugins.PomodoroTimerSupervisor, pid)
            start_timer_child(process_id, chat_id, chat_type, timer_id)
        end
    end
  end

  defp start_timer_child(process_id, chat_id, chat_type, timer_id) do
    case DynamicSupervisor.start_child(
           Pomoroom.ChatPlugins.PomodoroTimerSupervisor,
           {PomodoroTimerServer,
            %{
              process_id: process_id,
              chat_id: chat_id,
              chat_type: chat_type,
              timer_id: timer_id
            }}
         ) do
      {:ok, _pid} -> {:ok, process_id}
      {:error, {:already_started, _pid}} -> {:ok, process_id}
      {:error, reason} -> {:error, reason}
    end
  end

  def terminate_timer_process(process_id) do
    case Registry.lookup(Registry.PomodoroPluginTimer, process_id) do
      [{pid, _value}] ->
        DynamicSupervisor.terminate_child(Pomoroom.ChatPlugins.PomodoroTimerSupervisor, pid)

      [] ->
        :ok
    end

    :ok
  end
end
