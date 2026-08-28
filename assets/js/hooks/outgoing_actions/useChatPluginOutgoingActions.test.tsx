import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { useChatPluginOutgoingActions } from "./useChatPluginOutgoingActions";

function setup() {
  const pushEventToLiveView = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      useChatPluginOutgoingActions({ removeEvent, pushEventToLiveView });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView };
}

describe("useChatPluginOutgoingActions", () => {
  it("pushes action.install_chat_plugin when install_chat_plugin is emitted", () => {
    const { result, pushEventToLiveView } = setup();
    const payload = { chat_id: "chat-1", chat_type: "group" as const, plugin_type: "kanban" };

    act(() => {
      result.current.addEvent("install_chat_plugin", payload);
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.install_chat_plugin", payload);
  });

  it("pushes action.uninstall_chat_plugin when uninstall_chat_plugin is emitted", () => {
    const { result, pushEventToLiveView } = setup();
    const payload = { chat_id: "chat-1", chat_type: "private" as const, plugin_id: "plugin-9" };

    act(() => {
      result.current.addEvent("uninstall_chat_plugin", payload);
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.uninstall_chat_plugin", payload);
  });
});
