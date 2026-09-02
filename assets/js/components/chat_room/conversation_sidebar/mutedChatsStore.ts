import { useSyncExternalStore } from "react";

const STORAGE_KEY = "pomoroom:muted_chats";

const listeners = new Set<() => void>();

const readFromStorage = (): Set<string> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

let mutedChatIds = readFromStorage();

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(mutedChatIds)));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - mute state stays in-memory only.
  }
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeMutedChats = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const isChatMuted = (chatId: string) => mutedChatIds.has(chatId);

export const muteChat = (chatId: string) => {
  if (!chatId || mutedChatIds.has(chatId)) return;

  mutedChatIds = new Set(mutedChatIds).add(chatId);
  persist();
  emitChange();
};

export const unmuteChat = (chatId: string) => {
  if (!chatId || !mutedChatIds.has(chatId)) return;

  const nextMutedChatIds = new Set(mutedChatIds);
  nextMutedChatIds.delete(chatId);
  mutedChatIds = nextMutedChatIds;
  persist();
  emitChange();
};

export const toggleChatMuted = (chatId: string) => {
  if (isChatMuted(chatId)) {
    unmuteChat(chatId);
  } else {
    muteChat(chatId);
  }
};

export const useIsChatMuted = (chatId: string) => {
  return useSyncExternalStore(
    subscribeMutedChats,
    () => (chatId ? isChatMuted(chatId) : false),
    () => false
  );
};
