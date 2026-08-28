import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { EventProvider, useEventContext } from "../components/chat_room/EventContext";
import AddContactOrGroup from "../components/chat_room/user_info_bar/AddContactOrGroup";
import ConversationTargetsList from "../components/chat_room/conversation_sidebar/ConversationTargetsList";
import {
  InfoChatSelected,
  useContactsAndGroupsOutgoingActions,
} from "../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { useUserContactsAndGroupsEvents } from "../hooks/useUserContactsAndGroupsEvents";
import { PushEventToLiveView } from "../types/events";
import { initI18n } from "../i18n";

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  return {
    ...actual,
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

beforeAll(() => {
  initI18n("es");
});

type HarnessProps = {
  eventName: string;
  eventData: Record<string, unknown>;
  pushEventToLiveView: PushEventToLiveView;
};

function ChatRoomSlice({ eventName, eventData, pushEventToLiveView }: HarnessProps) {
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

  return (
    <>
      <AddContactOrGroup sendDataToParent={() => {}} receiveDataFromParent entryType="group" />
      <ConversationTargetsList />
    </>
  );
}

function renderHarness(pushEventToLiveView: PushEventToLiveView) {
  return render(
    <EventProvider>
      <ChatRoomSlice eventName="" eventData={{}} pushEventToLiveView={pushEventToLiveView} />
    </EventProvider>
  );
}

describe("create group flow (form submit -> LiveView push -> server confirmation -> reflected in the list)", () => {
  it("creates a group and shows it in the conversation list once the server confirms it", async () => {
    const user = userEvent.setup();
    const pushEventToLiveView = vi.fn();
    const { rerender } = renderHarness(pushEventToLiveView);

    await user.type(screen.getByPlaceholderText("Añade tu próxima sala"), "grupo1");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.add_group", { name: "grupo1" });
    expect(screen.queryByText("grupo1")).not.toBeInTheDocument();

    rerender(
      <EventProvider>
        <ChatRoomSlice
          eventName="add_group_to_list"
          eventData={{
            group_data: {
              name: "grupo1",
              chat_id: "chat-1",
              image: "/images/default_group/default_group-1.svg",
              members: [{ user_id: "from_user1", joined_at: new Date().toISOString() }],
              admin: ["from_user1"],
            },
            is_group: true,
          }}
          pushEventToLiveView={pushEventToLiveView}
        />
      </EventProvider>
    );

    expect(message.success).toHaveBeenCalledWith("Grupo creado exitosamente!", 2);
    expect(screen.getByText("grupo1")).toBeInTheDocument();
  });
});
