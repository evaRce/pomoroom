import React, { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { EventProvider, useEventContext } from "../components/chat_room/EventContext";
import {
  InfoChatSelected,
  useContactsAndGroupsOutgoingActions,
} from "../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { useGroupMembershipEvents } from "../hooks/useGroupMemberEvents";
import { initI18n } from "../i18n";
import { PushEventToLiveView } from "../types/events";

vi.mock("antd", () => ({
  message: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

beforeAll(() => {
  initI18n("es");
});

type HarnessProps = {
  eventName: string;
  eventData: Record<string, unknown>;
};

function setup(pushEventToLiveView: PushEventToLiveView) {
  return renderHook(
    ({ eventName, eventData }: HarnessProps) => {
      const { addEvent, removeEvent } = useEventContext();
      const [component, setComponent] = useState("");
      const [isVisibleDetail, setIsVisibleDetail] = useState(false);
      const [infoChatSelected, setInfoChatSelected] = useState<InfoChatSelected>({});

      useContactsAndGroupsOutgoingActions({
        removeEvent,
        pushEventToLiveView,
        infoChatSelected,
        isVisibleDetail,
        setIsVisibleDetail,
        setInfoChatSelected,
        setComponent,
      });

      useGroupMembershipEvents({ eventName, eventData, addEvent, removeEvent });

      return { component, isVisibleDetail, infoChatSelected, addEvent };
    },
    {
      wrapper: ({ children }) => <EventProvider>{children}</EventProvider>,
      initialProps: { eventName: "", eventData: {} },
    }
  );
}

describe("group membership event bus flow (server event -> shared bus -> outgoing action)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("announces, in Spanish, and clears the panel when the selected group is deleted", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    act(() => {
      result.current.addEvent("selected_group_chat", { group_name: "grupo1" });
    });
    expect(result.current.infoChatSelected).toEqual({ group_name: "grupo1" });

    rerender({
      eventName: "group_deleted",
      eventData: { chat_id: "chat-1", group_name: "grupo1" },
    });

    expect(message.info).toHaveBeenCalledWith(
      'El grupo "grupo1" se ha eliminado porque ya no le quedan miembros.'
    );
    expect(result.current.infoChatSelected).toEqual({});
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.get_list_contact", {});
  });

  it("does not clear the panel when a different group is deleted", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    act(() => {
      result.current.addEvent("selected_group_chat", { group_name: "grupo1" });
    });

    rerender({
      eventName: "group_deleted",
      eventData: { chat_id: "chat-2", group_name: "grupo2" },
    });

    expect(result.current.infoChatSelected).toEqual({ group_name: "grupo1" });
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.get_list_contact", {});
  });

  it("only processes a given group_member_added signature once", () => {
    const pushEventToLiveView = vi.fn();
    const { rerender } = setup(pushEventToLiveView);

    const eventData = { chat_id: "chat-1", group_name: "grupo1", is_admin: true };
    rerender({ eventName: "group_member_added", eventData });
    rerender({ eventName: "group_member_added", eventData });

    const getListContactCalls = pushEventToLiveView.mock.calls.filter(
      ([action]) => action === "action.get_list_contact"
    );
    expect(getListContactCalls).toHaveLength(1);
  });
});
