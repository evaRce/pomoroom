import { useSyncExternalStore } from "react";
import type { TimerMode } from "./PomodoroSettingsPopover";

export type PomodoroNotificationEntry = {
  hasPendingNotification: boolean;
  lastMode: TimerMode | null;
};

type PomodoroNotificationState = Record<string, PomodoroNotificationEntry>;

let notificationState: PomodoroNotificationState = {};
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const subscribePomodoroNotifications = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getPomodoroNotifications = () => notificationState;

export const getPomodoroNotification = (chatId: string) => notificationState[chatId];

export const markPomodoroNotification = (chatId: string, lastMode: TimerMode | null) => {
  if (!chatId) return;

  const currentEntry = notificationState[chatId];
  const nextEntry: PomodoroNotificationEntry = {
    hasPendingNotification: true,
    lastMode: lastMode ?? currentEntry?.lastMode ?? null,
  };

  if (
    currentEntry?.hasPendingNotification === nextEntry.hasPendingNotification &&
    currentEntry?.lastMode === nextEntry.lastMode
  ) {
    return;
  }

  notificationState = {
    ...notificationState,
    [chatId]: nextEntry,
  };

  emitChange();
};

export const clearPomodoroNotification = (chatId: string) => {
  if (!chatId || !notificationState[chatId]) return;

  const nextState = { ...notificationState };
  delete nextState[chatId];
  notificationState = nextState;
  emitChange();
};

export const clearAllPomodoroNotifications = () => {
  if (Object.keys(notificationState).length === 0) return;

  notificationState = {};
  emitChange();
};

export const usePomodoroNotification = (chatId: string) => {
  return useSyncExternalStore(
    subscribePomodoroNotifications,
    () => (chatId ? getPomodoroNotification(chatId) : undefined),
    () => undefined
  );
};
