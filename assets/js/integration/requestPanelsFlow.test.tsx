import React, { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider, useEvent, useEventContext } from "../components/chat_room/EventContext";
import RequestSend from "../components/chat_room/contact_requests/RequestSend";
import RejectedRequestSend from "../components/chat_room/contact_requests/RejectedRequestSend";
import RejectedRequestReceived from "../components/chat_room/contact_requests/RejectedRequestReceived";
import {
  InfoChatSelected,
  useContactsAndGroupsOutgoingActions,
} from "../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { useFriendRequestEvents } from "../hooks/useFriendRequestEvents";
import { initI18n } from "../i18n";
import { PushEventToLiveView } from "../types/events";

beforeAll(() => {
  initI18n("es");
});

type HarnessProps = {
  eventName: string;
  eventData: Record<string, unknown>;
  userNickname: string;
  initialInfoChatSelected?: InfoChatSelected;
  pushEventToLiveView: PushEventToLiveView;
};

function ChatRoomSlice({
  eventName,
  eventData,
  userNickname,
  initialInfoChatSelected,
  pushEventToLiveView,
}: HarnessProps) {
  const { addEvent, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState<InfoChatSelected>(
    initialInfoChatSelected ?? {}
  );
  const deleteRejectedContact = useEvent("delete_rejected_contact");

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

  return (
    <>
      {component === "RequestSend" && <RequestSend imageNumber={1} />}
      {component === "RejectedRequestSend" && <RejectedRequestSend imageNumber={1} />}
      {component === "RejectedRequestReceived" && <RejectedRequestReceived imageNumber={1} />}
      <div data-testid="delete-rejected-contact">{deleteRejectedContact ?? ""}</div>
    </>
  );
}

function renderHarness(props: HarnessProps) {
  return render(
    <EventProvider>
      <ChatRoomSlice {...props} />
    </EventProvider>
  );
}

describe("request panels flow (sender/rejection notifications, driven by real events)", () => {
  it("shows the sender their own pending request", () => {
    const pushEventToLiveView = vi.fn();
    const request = { from_user: "from_user1", to_user: "to_user2", status: "pending" };

    const { container } = renderHarness({
      eventName: "open_chat_request_send",
      eventData: { request },
      userNickname: "from_user1",
      pushEventToLiveView,
    });

    expect(screen.getByText("to_user2")).toBeInTheDocument();
    expect(container.textContent).toContain("Has enviado una solicitud de amistad a to_user2.");
    expect(container.textContent).toContain("Esperando respuesta.");
  });

  it("shows the original sender that their request was rejected, and lets them acknowledge it", async () => {
    const user = userEvent.setup();
    const pushEventToLiveView = vi.fn();
    const rejected_request = { from_user: "from_user1", to_user: "to_user2", status: "rejected" };

    renderHarness({
      eventName: "open_rejected_request_send",
      eventData: { rejected_request },
      userNickname: "to_user2",
      initialInfoChatSelected: { contact_name: "from_user1" },
      pushEventToLiveView,
    });

    expect(
      screen.getByText(
        (_, node) => node?.textContent === "Has rechazado la solicitud de amistad de from_user1"
      )
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Entendido" }));
    });

    expect(screen.getByTestId("delete-rejected-contact")).toHaveTextContent("from_user1");
  });

  it("shows the recipient that their rejection went through, and lets them acknowledge it", async () => {
    const user = userEvent.setup();
    const pushEventToLiveView = vi.fn();
    const rejected_request = { from_user: "from_user1", to_user: "to_user2", status: "rejected" };

    renderHarness({
      eventName: "open_rejected_request_received",
      eventData: { rejected_request },
      userNickname: "from_user1",
      initialInfoChatSelected: { contact_name: "to_user2" },
      pushEventToLiveView,
    });

    expect(
      screen.getByText(
        (_, node) => node?.textContent === "Tu solicitud de amistad ha sido rechazada por to_user2"
      )
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Entendido" }));
    });

    expect(screen.getByTestId("delete-rejected-contact")).toHaveTextContent("to_user2");
  });
});
