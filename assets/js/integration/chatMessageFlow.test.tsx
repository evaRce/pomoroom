import React, { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../components/chat_room/EventContext";
import { useChatSessionEvents } from "../hooks/useChatSessionEvents";
import { useMessageOutgoingActions } from "../hooks/outgoing_actions/useMessageOutgoingActions";
import { sendMessageToUserAction } from "../services/messageService";
import { PushEventToLiveView } from "../types/events";

type HarnessProps = {
  eventName: string;
  eventData: Record<string, unknown>;
};

function setup(pushEventToLiveView: PushEventToLiveView) {
  return renderHook(
    ({ eventName, eventData }: HarnessProps) => {
      const { addEvent, removeEvent } = useEventContext();
      const [component, setComponent] = useState("");

      useMessageOutgoingActions({ removeEvent, pushEventToLiveView });

      useChatSessionEvents({
        eventName,
        eventData,
        addEvent,
        userNickname: "to_user2",
        setComponent,
      });

      return { component, addEvent };
    },
    {
      wrapper: ({ children }) => <EventProvider>{children}</EventProvider>,
      initialProps: { eventName: "", eventData: {} },
    }
  );
}

describe("chat message flow (open chat -> send message -> push to LiveView)", () => {
  it("opens the chat panel when the server announces a private chat, then pushes a sent message", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    rerender({
      eventName: "open_private_chat",
      eventData: {
        from_user_data: { nickname: "from_user1" },
        to_user_data: { nickname: "to_user2" },
        messages: [],
      },
    });

    expect(result.current.component).toBe("ChatPanel");

    act(() => {
      sendMessageToUserAction(result.current.addEvent, "hola", "from_user1");
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.send_message", {
      message: "hola",
      to_user: "from_user1",
    });
  });

  it("does not open the chat panel for an unrelated event", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    rerender({ eventName: "some_other_event", eventData: {} });

    expect(result.current.component).toBe("");
  });
});
