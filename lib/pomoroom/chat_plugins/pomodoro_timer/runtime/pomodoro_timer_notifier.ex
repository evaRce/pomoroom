defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerNotifier do
  alias Pomoroom.ChatRoom.ChatServer

  def timer_finished(%{last_completed_mode: mode} = state) do
    case pomodoro_text(mode) do
      nil ->
        :ok

      text ->
        ChatServer.send_plugin_message(
          state.chat_id,
          "pomodoro",
          text
        )
    end
  end

  defp pomodoro_text("work"), do: "⏰ Ha finalizado el temporizador de trabajo"
  defp pomodoro_text("shortBreak"), do: "☕ Ha finalizado el descanso corto"
  defp pomodoro_text("longBreak"), do: "🌙 Ha finalizado el descanso largo"
  defp pomodoro_text(_), do: nil
end
