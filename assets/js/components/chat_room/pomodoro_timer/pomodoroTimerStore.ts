import { TimerMode, TimerSettings } from "./PomodoroSettingsPopover";

export type TimerState = {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  cyclesCompleted: number;
  hasPendingWorkHalfCycle: boolean;
  settings: TimerSettings | null;
  modeSnapshots: Record<TimerMode, number>;
  completionVersion: number;
  lastCompletedMode: TimerMode | null;
  lastUpdated: number;
};

type TimerListener = (timer: TimerState | undefined) => void;

const timers = new Map<string, TimerState>();
const requested = new Set<string>();
const listeners = new Map<string, Set<TimerListener>>();
let intervalStarted = false;

function getModeDuration(timer: TimerState, mode: TimerMode): number {
  if (!timer.settings) return 0;

  switch (mode) {
    case "work":
      return timer.settings.workDuration * 60;
    case "shortBreak":
      return timer.settings.shortBreakDuration * 60;
    case "longBreak":
      return timer.settings.longBreakDuration * 60;
  }
}

function createModeSnapshots(settings: TimerSettings): Record<TimerMode, number> {
  return {
    work: settings.workDuration * 60,
    shortBreak: settings.shortBreakDuration * 60,
    longBreak: settings.longBreakDuration * 60,
  };
}

function getFallbackSnapshot(timer: TimerState, mode: TimerMode): number {
  if (!timer.settings) return 0;

  return getModeDuration(timer, mode);
}

function getModeSnapshot(timer: TimerState, mode: TimerMode): number {
  const snapshot = timer.modeSnapshots[mode];
  if (typeof snapshot === "number") {
    return snapshot;
  }

  return getFallbackSnapshot(timer, mode);
}

function advanceCompletedTimer(timer: TimerState, now: number): TimerState {
  if (!timer.settings) {
    return {
      ...timer,
      timeLeft: 0,
      isRunning: false,
      completionVersion: timer.completionVersion + 1,
      lastCompletedMode: timer.mode,
      lastUpdated: now,
    };
  }

  if (timer.mode === "work") {
    const nextMode =
      (timer.cyclesCompleted + 1) % timer.settings.cyclesBeforeLongBreak === 0
        ? "longBreak"
        : "shortBreak";
    const workDuration = getModeDuration(timer, "work");

    return {
      ...timer,
      timeLeft: getModeSnapshot(timer, nextMode),
      isRunning: false,
      mode: nextMode,
      hasPendingWorkHalfCycle: true,
      modeSnapshots: {
        ...timer.modeSnapshots,
        work: workDuration,
      },
      completionVersion: timer.completionVersion + 1,
      lastCompletedMode: "work",
      lastUpdated: now,
    };
  }

  const completedModeDuration = getModeDuration(timer, timer.mode);

  return {
    ...timer,
    timeLeft: getModeSnapshot(timer, "work"),
    isRunning: false,
    mode: "work",
    cyclesCompleted: timer.cyclesCompleted + 1,
    hasPendingWorkHalfCycle: false,
    modeSnapshots: {
      ...timer.modeSnapshots,
      [timer.mode]: completedModeDuration,
    },
    completionVersion: timer.completionVersion + 1,
    lastCompletedMode: timer.mode,
    lastUpdated: now,
  };
}

function notifyTimer(chatId: string) {
  const subscribedListeners = listeners.get(chatId);
  if (!subscribedListeners) return;

  const timer = timers.get(chatId);
  const snapshot = timer ? { ...timer } : undefined;

  subscribedListeners.forEach((listener) => {
    listener(snapshot);
  });
}

export function subscribeTimer(chatId: string, listener: TimerListener): () => void {
  let subscribedListeners = listeners.get(chatId);

  if (!subscribedListeners) {
    subscribedListeners = new Set();
    listeners.set(chatId, subscribedListeners);
  }

  subscribedListeners.add(listener);
  listener(timers.get(chatId) ? { ...timers.get(chatId)! } : undefined);

  return () => {
    const currentListeners = listeners.get(chatId);
    if (!currentListeners) return;

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      listeners.delete(chatId);
    }
  };
}

export function getTimer(chatId: string): TimerState | undefined {
  return timers.get(chatId);
}

export function createTimer(chatId: string, initial: TimerState): void {
  if (timers.has(chatId)) return;
  timers.set(chatId, initial);
  notifyTimer(chatId);
}

export function updateTimer(
  chatId: string,
  patch: Partial<TimerState>
): void {
  const current = timers.get(chatId);
  if (!current) return;

  const nextState: TimerState = {
    ...current,
    ...patch,
    modeSnapshots: patch.modeSnapshots
      ? patch.modeSnapshots
      : current.modeSnapshots,
    lastUpdated: Date.now(),
  };

  if (patch.mode && typeof patch.timeLeft === "number") {
    nextState.modeSnapshots = {
      ...nextState.modeSnapshots,
      [patch.mode]: patch.timeLeft,
    };
  }

  timers.set(chatId, nextState);

  notifyTimer(chatId);
}

export function deleteTimer(chatId: string): void {
  timers.delete(chatId);
  notifyTimer(chatId);
}

export function hasTimer(chatId: string): boolean {
  return timers.has(chatId);
}

export function getAllTimers(): Map<string, TimerState> {
  return new Map(timers);
}

export function clearAllTimers(): void {
  const chatIds = Array.from(timers.keys());
  timers.clear();

  for (const chatId of chatIds) {
    notifyTimer(chatId);
  }
}

export function hasRequestedConfig(chatId: string) {
  return requested.has(chatId);
}

export function markConfigRequested(chatId: string) {
  requested.add(chatId);
}

export function resetConfigRequested(chatId: string) {
  requested.delete(chatId);
}

export function startTimerEngine() {
  if (intervalStarted) return;
  intervalStarted = true;

  setInterval(() => {
    const now = Date.now();

    for (const [chatId, timer] of timers.entries()) {
      if (!timer.isRunning) continue;

      const newTimeLeft = Math.max(timer.timeLeft - 1, 0);

      if (newTimeLeft === 0) {
        timers.set(chatId, advanceCompletedTimer(timer, now));
        notifyTimer(chatId);
        continue;
      }

      timers.set(chatId, {
        ...timer,
        timeLeft: newTimeLeft,
        modeSnapshots: {
          ...timer.modeSnapshots,
          [timer.mode]: newTimeLeft,
        },
        lastUpdated: now,
      });

      notifyTimer(chatId);
    }
  }, 1000);
}

export function createInitialTimerState(settings: TimerSettings): TimerState {
  const modeSnapshots = createModeSnapshots(settings);

  return {
    timeLeft: modeSnapshots.work,
    isRunning: false,
    mode: "work",
    cyclesCompleted: 0,
    hasPendingWorkHalfCycle: false,
    settings,
    modeSnapshots,
    completionVersion: 0,
    lastCompletedMode: null,
    lastUpdated: Date.now(),
  };
}

export function getSnapshotForMode(chatId: string, mode: TimerMode): number {
  const timer = timers.get(chatId);
  if (!timer) return 0;

  return getModeSnapshot(timer, mode);
}
