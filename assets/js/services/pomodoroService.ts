type AddEvent = (eventName: string, eventData: any) => void;

interface PomodoroConfigPayload {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  cycles_before_long_break: number;
}

export function requestPomodoroState(
  addEvent: AddEvent,
  chatId: string,
  chatType: "private" | "group"
): void {
  addEvent("get_pomodoro_state", { chat_id: chatId, chat_type: chatType });
}

export function startPomodoroTimer(
  addEvent: AddEvent,
  chatId: string,
  chatType: "private" | "group"
): void {
  addEvent("start_pomodoro_timer", { chat_id: chatId, chat_type: chatType });
}

export function pausePomodoroTimer(
  addEvent: AddEvent,
  chatId: string,
  chatType: "private" | "group"
): void {
  addEvent("pause_pomodoro_timer", { chat_id: chatId, chat_type: chatType });
}

export function resetPomodoroTimer(
  addEvent: AddEvent,
  chatId: string,
  chatType: "private" | "group"
): void {
  addEvent("reset_pomodoro_timer", { chat_id: chatId, chat_type: chatType });
}

export function setPomodoroTimerMode(
  addEvent: AddEvent,
  chatId: string,
  chatType: "private" | "group",
  mode: string
): void {
  addEvent("set_pomodoro_timer_mode", { chat_id: chatId, chat_type: chatType, mode });
}

export function savePomodoroConfig(
  addEvent: AddEvent,
  timerId: string,
  chatId: string,
  chatType: "private" | "group",
  expectedConfigVersion: number,
  config: PomodoroConfigPayload
): void {
  addEvent("update_pomodoro_plugin_config", {
    timer_id: timerId,
    chat_id: chatId,
    chat_type: chatType,
    expected_config_version: expectedConfigVersion,
    config,
  });
}
