import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { useMessageOutgoingActions } from "./useMessageOutgoingActions";

function setup() {
  const pushEventToLiveView = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      useMessageOutgoingActions({ removeEvent, pushEventToLiveView });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView };
}

describe("useMessageOutgoingActions", () => {
  it("pushes action.send_message when send_message is emitted", () => {
    const { result, pushEventToLiveView } = setup();
    const payload = { message: "hola", to_user: "bob01" };

    act(() => {
      result.current.addEvent("send_message", payload);
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.send_message", payload);
  });

  it("pushes action.load_older_messages when load_older_messages is emitted", () => {
    const { result, pushEventToLiveView } = setup();
    const payload = { chat_id: "chat-1", before_inserted_at: "2026-01-01", before_db_id: "db-1" };

    act(() => {
      result.current.addEvent("load_older_messages", payload);
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.load_older_messages", payload);
  });
});
