defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService do
  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.{PomodoroTimerServer, Runtime}

  def get_config(chat_id, chat_type) do
    case ensure_started(chat_id, chat_type) do
      {:ok, process_id} ->
        PomodoroTimerServer.get_config(process_id)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def ensure_started(chat_id, chat_type) do
    Runtime.ensure_pomodoro_plugin_started(
      process_id(chat_id, chat_type),
      chat_id,
      chat_type
    )
  end

  def update_config(chat_id, chat_type, config) do
    case ensure_started(chat_id, chat_type) do
      {:ok, process_id} ->
        PomodoroTimerServer.update_config(process_id, config)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_timer(chat_id, chat_type) do
    Runtime.delete_timer(process_id(chat_id, chat_type), chat_id, chat_type)
  end

  defp process_id(chat_id, chat_type) do
    "pomodoro:#{chat_type}:#{chat_id}"
  end
end
