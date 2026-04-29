defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimers do
  alias Pomoroom.ChatPlugins.PomodoroTimer.{PomodoroTimerSchema, PomodoroTimerService}

  defdelegate changeset(args), to: PomodoroTimerSchema
  defdelegate timer_changeset(args), to: PomodoroTimerSchema
  defdelegate get_config(chat_id, chat_type), to: PomodoroTimerService
  defdelegate update_config(chat_id, chat_type, plugin_id, config, updated_by), to: PomodoroTimerService
  defdelegate delete_timer(chat_id, chat_type, plugin_id), to: PomodoroTimerService
end
