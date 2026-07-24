import { useEffect } from "react";
import { useEvent } from "../../components/chat_room/EventContext";

type UsePomodoroOutgoingActionsParams = {
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
};

export function usePomodoroOutgoingActions({
  removeEvent,
  pushEventToLiveView,
}: UsePomodoroOutgoingActionsParams) {
  const getPomodoroState = useEvent("get_pomodoro_state");
  const updatePomodoroPluginConfig = useEvent("update_pomodoro_plugin_config");
  const startPomodoroTimer = useEvent("start_pomodoro_timer");
  const pausePomodoroTimer = useEvent("pause_pomodoro_timer");
  const resetPomodoroTimer = useEvent("reset_pomodoro_timer");
  const setPomodoroTimerMode = useEvent("set_pomodoro_timer_mode");

  useEffect(() => {
    if (getPomodoroState) {
      pushEventToLiveView("action.get_pomodoro_state", getPomodoroState);
      removeEvent("get_pomodoro_state");
    }
    if (updatePomodoroPluginConfig) {
      pushEventToLiveView("action.update_pomodoro_plugin_config", updatePomodoroPluginConfig);
      removeEvent("update_pomodoro_plugin_config");
    }
    if (startPomodoroTimer) {
      pushEventToLiveView("action.start_pomodoro_timer", startPomodoroTimer);
      removeEvent("start_pomodoro_timer");
    }
    if (pausePomodoroTimer) {
      pushEventToLiveView("action.pause_pomodoro_timer", pausePomodoroTimer);
      removeEvent("pause_pomodoro_timer");
    }
    if (resetPomodoroTimer) {
      pushEventToLiveView("action.reset_pomodoro_timer", resetPomodoroTimer);
      removeEvent("reset_pomodoro_timer");
    }
    if (setPomodoroTimerMode) {
      pushEventToLiveView("action.set_pomodoro_timer_mode", setPomodoroTimerMode);
      removeEvent("set_pomodoro_timer_mode");
    }
  }, [
    getPomodoroState,
    updatePomodoroPluginConfig,
    startPomodoroTimer,
    pausePomodoroTimer,
    resetPomodoroTimer,
    setPomodoroTimerMode,
    pushEventToLiveView,
    removeEvent,
  ]);
}
