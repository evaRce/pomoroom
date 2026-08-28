import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAllTimers,
  clearRequestedConfigs,
  createInitialTimerState,
  createTimer,
  deleteTimer,
  getAllTimers,
  getSnapshotForMode,
  getTimer,
  hasRequestedConfig,
  hasTimer,
  markConfigRequested,
  normalizeTimerPayload,
  resetConfigRequested,
  subscribeTimer,
  updateTimer,
  type TimerState,
} from "./pomodoroTimerStore";

const SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
};

describe("pomodoroTimerStore", () => {
  afterEach(() => {
    clearAllTimers();
    clearRequestedConfigs();
    vi.restoreAllMocks();
  });

  describe("createInitialTimerState", () => {
    it("builds a fresh work-mode timer from the given settings", () => {
      const state = createInitialTimerState(SETTINGS);

      expect(state.mode).toBe("work");
      expect(state.timeLeft).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
      expect(state.cyclesCompleted).toBe(0);
      expect(state.modeSnapshots).toEqual({ work: 1500, shortBreak: 300, longBreak: 900 });
      expect(state.durationMs).toBe(1500 * 1000);
    });
  });

  describe("createTimer / getTimer / hasTimer / deleteTimer", () => {
    it("creates a timer that can then be read back", () => {
      const state = createInitialTimerState(SETTINGS);
      createTimer("chat-1", state);

      expect(hasTimer("chat-1")).toBe(true);
      expect(getTimer("chat-1")).toEqual(state);
    });

    it("does not overwrite an existing timer for the same chat", () => {
      const first = createInitialTimerState(SETTINGS);
      createTimer("chat-1", first);

      const second = createInitialTimerState({ ...SETTINGS, workDuration: 50 });
      createTimer("chat-1", second);

      expect(getTimer("chat-1")?.timeLeft).toBe(first.timeLeft);
    });

    it("deletes a timer", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      deleteTimer("chat-1");

      expect(hasTimer("chat-1")).toBe(false);
      expect(getTimer("chat-1")).toBeUndefined();
    });

    it("lists all active timers as an independent snapshot", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      createTimer("chat-2", createInitialTimerState(SETTINGS));

      const all = getAllTimers();
      expect(all.size).toBe(2);
      expect(all.has("chat-1")).toBe(true);
      expect(all.has("chat-2")).toBe(true);

      all.delete("chat-1");
      expect(getAllTimers().has("chat-1")).toBe(true);
    });
  });

  describe("updateTimer", () => {
    it("merges a partial patch into the existing timer", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      updateTimer("chat-1", { isRunning: true, timeLeft: 100 });

      const timer = getTimer("chat-1");
      expect(timer?.isRunning).toBe(true);
      expect(timer?.timeLeft).toBe(100);
    });

    it("does nothing when the chat has no timer", () => {
      updateTimer("missing-chat", { isRunning: true });

      expect(getTimer("missing-chat")).toBeUndefined();
    });

    it("records the new snapshot when mode and timeLeft change together", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      updateTimer("chat-1", { mode: "shortBreak", timeLeft: 200 });

      const timer = getTimer("chat-1");
      expect(timer?.modeSnapshots.shortBreak).toBe(200);
    });
  });

  describe("subscribeTimer", () => {
    it("invokes the listener immediately with the current timer state", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      const listener = vi.fn();

      const unsubscribe = subscribeTimer("chat-1", listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]?.mode).toBe("work");
      unsubscribe();
    });

    it("notifies subscribers again when the timer updates", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      const listener = vi.fn();
      const unsubscribe = subscribeTimer("chat-1", listener);
      listener.mockClear();

      updateTimer("chat-1", { isRunning: true });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]?.isRunning).toBe(true);
      unsubscribe();
    });

    it("stops notifying once unsubscribed", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      const listener = vi.fn();
      const unsubscribe = subscribeTimer("chat-1", listener);
      unsubscribe();
      listener.mockClear();

      updateTimer("chat-1", { isRunning: true });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("requested config tracking", () => {
    it("tracks whether a chat's config has been requested", () => {
      expect(hasRequestedConfig("chat-1")).toBe(false);

      markConfigRequested("chat-1");
      expect(hasRequestedConfig("chat-1")).toBe(true);

      resetConfigRequested("chat-1");
      expect(hasRequestedConfig("chat-1")).toBe(false);
    });

    it("clears every requested config", () => {
      markConfigRequested("chat-1");
      markConfigRequested("chat-2");

      clearRequestedConfigs();

      expect(hasRequestedConfig("chat-1")).toBe(false);
      expect(hasRequestedConfig("chat-2")).toBe(false);
    });
  });

  describe("getSnapshotForMode", () => {
    it("returns 0 when the chat has no timer", () => {
      expect(getSnapshotForMode("missing-chat", "work")).toBe(0);
    });

    it("returns the stored snapshot for a mode", () => {
      createTimer("chat-1", createInitialTimerState(SETTINGS));
      expect(getSnapshotForMode("chat-1", "shortBreak")).toBe(300);
    });
  });

  describe("normalizeTimerPayload", () => {
    it("returns null for an undefined payload", () => {
      expect(normalizeTimerPayload(undefined)).toBeNull();
    });

    it("computes remaining time for a running timer from the server clock", () => {
      vi.spyOn(Date, "now").mockReturnValue(1_000_000);

      const state = normalizeTimerPayload({
        chat_id: "chat-1",
        server_now: 1_000_000,
        state: {
          mode: "work",
          is_running: true,
          started_at: 1_000_000 - 10_000,
          duration_ms: 25 * 60 * 1000,
          settings: {
            work_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            cycles_before_long_break: 4,
          },
        },
      }) as TimerState;

      expect(state.isRunning).toBe(true);
      expect(state.mode).toBe("work");
      expect(state.timeLeft).toBe(25 * 60 - 10);
    });

    it("computes remaining time for a paused timer from startedAt/pausedAt", () => {
      const state = normalizeTimerPayload({
        chat_id: "chat-1",
        state: {
          mode: "work",
          is_running: false,
          started_at: 1_000,
          paused_at: 16_000,
          duration_ms: 60_000,
        },
      }) as TimerState;

      expect(state.isRunning).toBe(false);
      expect(state.timeLeft).toBe(45);
    });

    it("falls back to the full duration when the timer never started", () => {
      const state = normalizeTimerPayload({
        chat_id: "chat-1",
        state: {
          mode: "work",
          duration_ms: 90_000,
        },
      }) as TimerState;

      expect(state.timeLeft).toBe(90);
      expect(state.startedAt).toBeNull();
    });

    it("defaults missing settings fields to zero", () => {
      const state = normalizeTimerPayload({ chat_id: "chat-1", state: {} }) as TimerState;

      expect(state.settings).toEqual({
        workDuration: 0,
        shortBreakDuration: 0,
        longBreakDuration: 0,
        cyclesBeforeLongBreak: 0,
      });
      expect(state.mode).toBe("work");
    });
  });
});
