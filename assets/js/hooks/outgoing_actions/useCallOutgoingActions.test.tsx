import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { useCallOutgoingActions } from "./useCallOutgoingActions";

function setup() {
  const pushEventToLiveView = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      useCallOutgoingActions({ removeEvent, pushEventToLiveView });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView };
}

describe("useCallOutgoingActions", () => {
  it("pushes action.join_room when a join_room event is emitted", () => {
    const { result, pushEventToLiveView } = setup();

    act(() => {
      result.current.addEvent("join_room", { chat_id: "chat-1" });
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.join_room", { chat_id: "chat-1" });
  });

  it("does not push anything when no event has been emitted", () => {
    const { pushEventToLiveView } = setup();

    expect(pushEventToLiveView).not.toHaveBeenCalled();
  });
});
