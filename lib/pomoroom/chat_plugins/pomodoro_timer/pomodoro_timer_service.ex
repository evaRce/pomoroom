defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService do
  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.{PomodoroTimerServer, Runtime}

  @plugin_id "pomodoro"

  def get_config(chat_id, chat_type) do
    get_config(chat_id, chat_type, @plugin_id)
  end

  def get_config(chat_id, chat_type, plugin_id) do
    case ensure_started(chat_id, chat_type, plugin_id) do
      {:ok, process_id} ->
        PomodoroTimerServer.get_config(process_id)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def ensure_started(chat_id, chat_type, plugin_id \\ @plugin_id) do
    Runtime.ensure_pomodoro_plugin_started(
      process_id(chat_id, chat_type, plugin_id),
      chat_id,
      chat_type
    )
  end

  def update_config(chat_id, chat_type, config, updated_by) do
    update_config(chat_id, chat_type, @plugin_id, config, updated_by)
  end

  def update_config(chat_id, chat_type, plugin_id, config, updated_by) do
    case ensure_started(chat_id, chat_type, plugin_id) do
      {:ok, process_id} ->
        PomodoroTimerServer.update_config(process_id, config, updated_by)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_timer(chat_id, chat_type, plugin_id \\ @plugin_id) do
    Runtime.delete_timer(process_id(chat_id, chat_type, plugin_id), chat_id, chat_type, plugin_id)
  end

  defp process_id(chat_id, chat_type, plugin_id) do
    "#{plugin_id}:#{chat_type}:#{chat_id}"
  end
end
