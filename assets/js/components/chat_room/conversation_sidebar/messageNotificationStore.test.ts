import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllMessageNotifications,
  clearMessageNotification,
  getMessageNotification,
  markMessageNotification,
  subscribeMessageNotifications,
  useMessageNotification,
} from "./messageNotificationStore";

beforeEach(() => {
  clearAllMessageNotifications();
});

describe("messageNotificationStore", () => {
  it("reports no notification for a chat that was never marked", () => {
    expect(getMessageNotification("chat-1")).toBe(false);
  });

  it("marks a chat as having a notification", () => {
    markMessageNotification("chat-1");
    expect(getMessageNotification("chat-1")).toBe(true);
  });

  it("does nothing when marking a falsy chat id", () => {
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    markMessageNotification("");

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify listeners again when marking an already-marked chat", () => {
    markMessageNotification("chat-1");
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    markMessageNotification("chat-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("clears a marked chat's notification", () => {
    markMessageNotification("chat-1");

    clearMessageNotification("chat-1");

    expect(getMessageNotification("chat-1")).toBe(false);
  });

  it("does not notify listeners when clearing a chat with no notification", () => {
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    clearMessageNotification("chat-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify listeners when clearing a falsy chat id", () => {
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    clearMessageNotification("");

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies listeners exactly once when marking a chat", () => {
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    markMessageNotification("chat-1");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("clears every chat's notification at once", () => {
    markMessageNotification("chat-1");
    markMessageNotification("chat-2");

    clearAllMessageNotifications();

    expect(getMessageNotification("chat-1")).toBe(false);
    expect(getMessageNotification("chat-2")).toBe(false);
  });

  it("does not notify listeners when clearing all with nothing marked", () => {
    const listener = vi.fn();
    subscribeMessageNotifications(listener);

    clearAllMessageNotifications();

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying a listener once it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMessageNotifications(listener);

    unsubscribe();
    markMessageNotification("chat-1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("useMessageNotification reflects the current state and updates on change", () => {
    const { result } = renderHook(() => useMessageNotification("chat-1"));

    expect(result.current).toBe(false);

    act(() => {
      markMessageNotification("chat-1");
    });

    expect(result.current).toBe(true);

    act(() => {
      clearMessageNotification("chat-1");
    });

    expect(result.current).toBe(false);
  });

  it("useMessageNotification returns false for an empty chat id", () => {
    const { result } = renderHook(() => useMessageNotification(""));
    expect(result.current).toBe(false);
  });
});
