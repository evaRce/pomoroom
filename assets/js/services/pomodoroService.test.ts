import { describe, expect, it, vi } from "vitest";
import {
  pausePomodoroTimerAction,
  requestPomodoroStateAction,
  resetPomodoroTimerAction,
  savePomodoroConfigAction,
  setPomodoroTimerModeAction,
  startPomodoroTimerAction,
} from "./pomodoroService";

describe("pomodoroService", () => {
  it("requestPomodoroStateAction emits get_pomodoro_state with the chat context", () => {
    const addEvent = vi.fn();
    requestPomodoroStateAction(addEvent, "chat-1", "group");
    expect(addEvent).toHaveBeenCalledWith("get_pomodoro_state", { chat_id: "chat-1", chat_type: "group" });
  });

  it("startPomodoroTimerAction emits start_pomodoro_timer with the chat context", () => {
    const addEvent = vi.fn();
    startPomodoroTimerAction(addEvent, "chat-1", "private");
    expect(addEvent).toHaveBeenCalledWith("start_pomodoro_timer", { chat_id: "chat-1", chat_type: "private" });
  });

  it("pausePomodoroTimerAction emits pause_pomodoro_timer with the chat context", () => {
    const addEvent = vi.fn();
    pausePomodoroTimerAction(addEvent, "chat-1", "private");
    expect(addEvent).toHaveBeenCalledWith("pause_pomodoro_timer", { chat_id: "chat-1", chat_type: "private" });
  });

  it("resetPomodoroTimerAction emits reset_pomodoro_timer with the chat context", () => {
    const addEvent = vi.fn();
    resetPomodoroTimerAction(addEvent, "chat-1", "group");
    expect(addEvent).toHaveBeenCalledWith("reset_pomodoro_timer", { chat_id: "chat-1", chat_type: "group" });
  });

  it("setPomodoroTimerModeAction emits set_pomodoro_timer_mode with the target mode", () => {
    const addEvent = vi.fn();
    setPomodoroTimerModeAction(addEvent, "chat-1", "group", "shortBreak");
    expect(addEvent).toHaveBeenCalledWith("set_pomodoro_timer_mode", {
      chat_id: "chat-1",
      chat_type: "group",
      mode: "shortBreak",
    });
  });

  it("savePomodoroConfigAction emits update_pomodoro_plugin_config with the full config", () => {
    const addEvent = vi.fn();
    const config = {
      work_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      cycles_before_long_break: 4,
    };

    savePomodoroConfigAction(addEvent, "timer-1", "chat-1", "group", config);

    expect(addEvent).toHaveBeenCalledWith("update_pomodoro_plugin_config", {
      timer_id: "timer-1",
      chat_id: "chat-1",
      chat_type: "group",
      config,
    });
  });
});
