defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerNotifier do
  import PomoroomWeb.Gettext

  alias Pomoroom.Chats.Runtime.ChatServer

  def timer_finished(%{last_completed_mode: mode} = state) do
    Gettext.put_locale(
      PomoroomWeb.Gettext,
      Map.get(state, :locale) || Gettext.get_locale(PomoroomWeb.Gettext)
    )

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

  defp pomodoro_text("work"), do: "⏰ " <> gettext("Ha finalizado el temporizador de trabajo")
  defp pomodoro_text("shortBreak"), do: "☕ " <> gettext("Ha finalizado el descanso corto")
  defp pomodoro_text("longBreak"), do: "🌙 " <> gettext("Ha finalizado el descanso largo")
  defp pomodoro_text(_), do: nil
end
