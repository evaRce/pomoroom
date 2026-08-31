import React, { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEvent, useEventContext } from "../components/chat_room/EventContext";
import { useChatSessionEvents } from "../hooks/useChatSessionEvents";
import { useChatPluginOutgoingActions } from "../hooks/outgoing_actions/useChatPluginOutgoingActions";
import { installChatPluginAction, uninstallChatPluginAction } from "../services/chatPluginService";
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
      const chatPluginInstalled = useEvent("chat_plugin_installed");

      useChatPluginOutgoingActions({ removeEvent, pushEventToLiveView });

      useChatSessionEvents({
        eventName,
        eventData,
        addEvent,
        userNickname: "from_user1",
        setComponent,
      });

      return { addEvent, chatPluginInstalled };
    },
    {
      wrapper: ({ children }) => <EventProvider>{children}</EventProvider>,
      initialProps: { eventName: "", eventData: {} },
    }
  );
}

describe("chat plugin flow (install/uninstall request -> LiveView, server confirmation -> bus)", () => {
  it("pushes the install request, then forwards the server's confirmation onto the bus", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    act(() => {
      installChatPluginAction(result.current.addEvent, "chat-1", "group", "kanban");
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.install_chat_plugin", {
      chat_id: "chat-1",
      chat_type: "group",
      plugin_type: "kanban",
    });

    expect(result.current.chatPluginInstalled).toBeUndefined();

    rerender({
      eventName: "chat_plugin_installed",
      eventData: { chat_id: "chat-1", plugin: { type: "kanban", name: "Kanban" } },
    });

    expect(result.current.chatPluginInstalled).toEqual({
      chat_id: "chat-1",
      plugin: { type: "kanban", name: "Kanban" },
    });
  });

  it("pushes the uninstall request to the LiveView", () => {
    const pushEventToLiveView = vi.fn();
    const { result } = setup(pushEventToLiveView);

    act(() => {
      uninstallChatPluginAction(result.current.addEvent, "chat-1", "group", "plugin-9");
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.uninstall_chat_plugin", {
      chat_id: "chat-1",
      chat_type: "group",
      plugin_id: "plugin-9",
    });
  });
});
