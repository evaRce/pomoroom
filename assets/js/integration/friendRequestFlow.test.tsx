import React, { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../components/chat_room/EventContext";
import RequestReceived from "../components/chat_room/contact_requests/RequestReceived";
import { useFriendRequestEvents } from "../hooks/useFriendRequestEvents";
import {
  InfoChatSelected,
  useContactsAndGroupsOutgoingActions,
} from "../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { initI18n } from "../i18n";
import { PushEventToLiveView } from "../types/events";

beforeAll(() => {
  initI18n("es");
});

type HarnessProps = {
  eventName: string;
  eventData: Record<string, unknown>;
  userNickname: string;
  pushEventToLiveView: PushEventToLiveView;
};

function ChatRoomSlice({ eventName, eventData, userNickname, pushEventToLiveView }: HarnessProps) {
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

  useFriendRequestEvents({
    eventName,
    eventData,
    addEvent,
    userNickname,
    setIsVisibleDetail,
    setComponent,
    infoChatSelected,
  });

  return component === "RequestReceived" ? <RequestReceived imageNumber={1} /> : null;
}

function renderHarness(props: HarnessProps) {
  return render(
    <EventProvider>
      <ChatRoomSlice {...props} />
    </EventProvider>
  );
}

describe("friend request flow (incoming event -> component -> outgoing action)", () => {
  it("shows the request panel to the recipient and pushes the acceptance to the LiveView", async () => {
    const user = userEvent.setup();
    const pushEventToLiveView = vi.fn();
    const request = { from_user: "from_user1", to_user: "to_user2", status: "pending" };

    renderHarness({
      eventName: "open_chat_request_received",
      eventData: { request },
      userNickname: "to_user2",
      pushEventToLiveView,
    });

    expect(
      screen.getByText(
        (_, node) => node?.textContent === "from_user1 te ha enviado una solicitud de amistad."
      )
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Aceptar" }));
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.update_status_request", {
      status: "accepted",
      contact_name: "to_user2",
      from_user_name: "from_user1",
    });
  });

  it("rejects and pushes the rejection to the LiveView", async () => {
    const user = userEvent.setup();
    const pushEventToLiveView = vi.fn();
    const request = { from_user: "from_user1", to_user: "to_user2", status: "pending" };

    renderHarness({
      eventName: "open_chat_request_received",
      eventData: { request },
      userNickname: "to_user2",
      pushEventToLiveView,
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Rechazar" }));
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.update_status_request", {
      status: "rejected",
      contact_name: "to_user2",
      from_user_name: "from_user1",
    });
  });

  it("does not show the request panel to someone other than the recipient", () => {
    const pushEventToLiveView = vi.fn();
    const request = { from_user: "from_user1", to_user: "to_user2", status: "pending" };

    renderHarness({
      eventName: "open_chat_request_received",
      eventData: { request },
      userNickname: "someone_else",
      pushEventToLiveView,
    });

    expect(screen.queryByRole("button", { name: "Aceptar" })).not.toBeInTheDocument();
  });
});
