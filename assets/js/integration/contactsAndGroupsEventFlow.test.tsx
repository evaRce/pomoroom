import React, { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../components/chat_room/EventContext";
import {
  InfoChatSelected,
  useContactsAndGroupsOutgoingActions,
} from "../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { useUserContactsAndGroupsEvents } from "../hooks/useUserContactsAndGroupsEvents";
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
      const [isVisibleDetail, setIsVisibleDetail] = useState(false);
      const [infoChatSelected, setInfoChatSelected] = useState<InfoChatSelected>({});
      const [userNickname, setUserNickname] = useState("");

      useContactsAndGroupsOutgoingActions({
        removeEvent,
        pushEventToLiveView,
        infoChatSelected,
        isVisibleDetail,
        setIsVisibleDetail,
        setInfoChatSelected,
        setComponent,
      });

      useUserContactsAndGroupsEvents({ eventName, eventData, addEvent, setUserNickname });

      return { component, isVisibleDetail, infoChatSelected, userNickname, addEvent };
    },
    {
      wrapper: ({ children }) => <EventProvider>{children}</EventProvider>,
      initialProps: { eventName: "", eventData: {} },
    }
  );
}

describe("contacts/groups event bus flow (server event -> shared bus -> outgoing action)", () => {
  it("clears the selected contact's detail panel and refreshes the conversation list when it is removed", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    act(() => {
      result.current.addEvent("selected_private_chat", { contact_name: "to_user2" });
    });
    expect(result.current.infoChatSelected).toEqual({ contact_name: "to_user2" });

    rerender({
      eventName: "contact_removed",
      eventData: { contact_name: "to_user2", chat_id: "chat-1" },
    });

    expect(result.current.infoChatSelected).toEqual({});
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.get_list_contact", {});
  });

  it("does not touch the detail panel when a different contact is removed", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    act(() => {
      result.current.addEvent("selected_private_chat", { contact_name: "to_user2" });
    });

    rerender({
      eventName: "contact_removed",
      eventData: { contact_name: "someone_else", chat_id: "chat-2" },
    });

    expect(result.current.infoChatSelected).toEqual({ contact_name: "to_user2" });
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.get_list_contact", {});
  });

  it("stores the nickname announced by the server and forwards it on the bus", () => {
    const pushEventToLiveView = vi.fn();
    const { result, rerender } = setup(pushEventToLiveView);

    rerender({
      eventName: "show_user_info",
      eventData: { nickname: "from_user1", image_profile: "avatar.png" },
    });

    expect(result.current.userNickname).toBe("from_user1");
  });
});
