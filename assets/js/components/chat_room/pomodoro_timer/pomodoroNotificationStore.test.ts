import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAllPomodoroNotifications,
  clearPomodoroNotification,
  getPomodoroNotification,
  markPomodoroNotification,
  subscribePomodoroNotifications,
} from "./pomodoroNotificationStore";

describe("pomodoroNotificationStore", () => {
  afterEach(() => {
    clearAllPomodoroNotifications();
  });

  it("has no notification for a chat before one is marked", () => {
    expect(getPomodoroNotification("chat-1")).toBeUndefined();
  });

  it("marks a pending notification with the given mode", () => {
    markPomodoroNotification("chat-1", "work");

    expect(getPomodoroNotification("chat-1")).toEqual({
      hasPendingNotification: true,
      lastMode: "work",
    });
  });

  it("does nothing when marking without a chat id", () => {
    markPomodoroNotification("", "work");

    expect(getPomodoroNotification("")).toBeUndefined();
  });

  it("keeps the previous mode when marking again without a new mode", () => {
    markPomodoroNotification("chat-1", "work");
    markPomodoroNotification("chat-1", null);

    expect(getPomodoroNotification("chat-1")).toEqual({
      hasPendingNotification: true,
      lastMode: "work",
    });
  });

  it("notifies subscribers when a notification is marked", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePomodoroNotifications(listener);

    markPomodoroNotification("chat-1", "work");

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("does not notify subscribers when the state does not change", () => {
    markPomodoroNotification("chat-1", "work");

    const listener = vi.fn();
    const unsubscribe = subscribePomodoroNotifications(listener);

    markPomodoroNotification("chat-1", "work");

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("clears a single chat's notification", () => {
    markPomodoroNotification("chat-1", "work");
    clearPomodoroNotification("chat-1");

    expect(getPomodoroNotification("chat-1")).toBeUndefined();
  });

  it("does nothing when clearing a chat with no notification", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePomodoroNotifications(listener);

    clearPomodoroNotification("chat-without-notification");

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("clears all notifications at once", () => {
    markPomodoroNotification("chat-1", "work");
    markPomodoroNotification("chat-2", "shortBreak");

    clearAllPomodoroNotifications();

    expect(getPomodoroNotification("chat-1")).toBeUndefined();
    expect(getPomodoroNotification("chat-2")).toBeUndefined();
  });

  it("unsubscribing stops further notifications", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePomodoroNotifications(listener);
    unsubscribe();

    markPomodoroNotification("chat-1", "work");

    expect(listener).not.toHaveBeenCalled();
  });
});
