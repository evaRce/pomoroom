defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimers do
  alias Pomoroom.ChatPlugins.PomodoroTimer.{PomodoroTimerSchema, PomodoroTimerService}

  defdelegate changeset(args), to: PomodoroTimerSchema
  defdelegate timer_changeset(args), to: PomodoroTimerSchema
  defdelegate get_state(chat_id, chat_type), to: PomodoroTimerService

  defdelegate update_config(chat_id, chat_type, config, expected_config_version),
    to: PomodoroTimerService

  defdelegate start(chat_id, chat_type), to: PomodoroTimerService
  defdelegate pause(chat_id, chat_type), to: PomodoroTimerService
  defdelegate reset(chat_id, chat_type), to: PomodoroTimerService
  defdelegate set_mode(chat_id, chat_type, mode), to: PomodoroTimerService
  defdelegate delete_timer_for_chat(chat_id, chat_type), to: PomodoroTimerService
end
