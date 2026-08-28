import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCallSignalingEvents } from "./useCallSignalEvents";

function setup(eventName: string, eventData: Record<string, unknown>) {
  const addEvent = vi.fn();

  renderHook(() => useCallSignalingEvents({ eventName, eventData, addEvent }));

  return { addEvent };
}

describe("useCallSignalingEvents", () => {
  it("forwards livekit_token payloads", () => {
    const payload = { token: "tok-1", ws_url: "wss://example.com", chat_id: "chat-1" };
    const { addEvent } = setup("livekit_token", payload);

    expect(addEvent).toHaveBeenCalledWith("livekit_token", payload);
  });

  it("ignores unrelated event names", () => {
    const { addEvent } = setup("some_other_event", { token: "tok-1" });

    expect(addEvent).not.toHaveBeenCalled();
  });
});
