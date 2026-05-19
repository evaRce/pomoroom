defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimers do
  alias Pomoroom.ChatPlugins.PomodoroTimer.{PomodoroTimerSchema, PomodoroTimerService}

  defdelegate changeset(args), to: PomodoroTimerSchema
  defdelegate timer_changeset(args), to: PomodoroTimerSchema
  defdelegate get_config(chat_id, chat_type), to: PomodoroTimerService
  defdelegate update_config(chat_id, chat_type, config), to: PomodoroTimerService
  defdelegate delete_timer_for_chat(chat_id, chat_type), to: PomodoroTimerService
end
