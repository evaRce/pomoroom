import { useSyncExternalStore } from "react";

type MessageNotificationState = Record<string, boolean>;

let notificationState: MessageNotificationState = {};
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeMessageNotifications = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getMessageNotification = (chatId: string) => Boolean(notificationState[chatId]);

export const markMessageNotification = (chatId: string) => {
  if (!chatId || notificationState[chatId]) return;

  notificationState = {
    ...notificationState,
    [chatId]: true,
  };

  emitChange();
};

export const clearMessageNotification = (chatId: string) => {
  if (!chatId || !notificationState[chatId]) return;

  const nextState = { ...notificationState };
  delete nextState[chatId];
  notificationState = nextState;
  emitChange();
};

export const clearAllMessageNotifications = () => {
  if (Object.keys(notificationState).length === 0) return;

  notificationState = {};
  emitChange();
};

export const useMessageNotification = (chatId: string) => {
  return useSyncExternalStore(
    subscribeMessageNotifications,
    () => (chatId ? getMessageNotification(chatId) : false),
    () => false
  );
};
