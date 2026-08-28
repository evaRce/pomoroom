import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { useErrorNotificationEvents } from "./useErrorNotificationEvents";

vi.mock("antd", () => ({
  message: {
    error: vi.fn(),
  },
}));

describe("useErrorNotificationEvents", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a string error message for a known error event", () => {
    renderHook(() =>
      useErrorNotificationEvents({ eventName: "error_sending_message", eventData: "Network error" })
    );

    expect(message.error).toHaveBeenCalledWith("Network error", 3);
  });

  it("shows the first value of an object error payload", () => {
    renderHook(() =>
      useErrorNotificationEvents({
        eventName: "error_deleting_contact",
        eventData: { reason: "Contact not found" },
      })
    );

    expect(message.error).toHaveBeenCalledWith("Contact not found", 3);
  });

  it("does nothing for event names outside the known error list", () => {
    renderHook(() => useErrorNotificationEvents({ eventName: "unrelated_event", eventData: "oops" }));

    expect(message.error).not.toHaveBeenCalled();
  });

  it("does nothing when eventData is empty", () => {
    renderHook(() => useErrorNotificationEvents({ eventName: "error_sending_message", eventData: "" }));

    expect(message.error).not.toHaveBeenCalled();
  });
});
