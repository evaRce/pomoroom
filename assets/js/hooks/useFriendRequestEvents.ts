import { useEffect } from "react";
import { AddEvent, FriendRequestRef } from "../types/events";
import type { InfoChatSelected } from "./outgoing_actions/useContactsAndGroupsOutgoingActions";

type RejectedRequestPayload = FriendRequestRef & { status: string };

type UseFriendRequestEventsParams = {
  eventName: string;
  eventData: Record<string, unknown> & {
    request?: FriendRequestRef & { status: string };
    rejected_request?: RejectedRequestPayload;
    new_status?: string;
  };
  addEvent: AddEvent;
  userNickname: string;
  setIsVisibleDetail: (value: boolean) => void;
  setComponent: (value: string) => void;
  infoChatSelected: InfoChatSelected;
};

export function useFriendRequestEvents({
  eventName,
  eventData,
  addEvent,
  userNickname,
  setIsVisibleDetail,
  setComponent,
  infoChatSelected,
}: UseFriendRequestEventsParams) {
  useEffect(() => {
    if (
      eventName === "open_chat_request_send" &&
      eventData.request &&
      userNickname === eventData.request.from_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestSend");
    }
    if (
      eventName === "open_chat_request_received" &&
      eventData.request &&
      userNickname === eventData.request.to_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestReceived");
    }
  }, [eventData.request]);

  useEffect(() => {
    if (
      eventName === "open_rejected_request_send" &&
      eventData.rejected_request &&
      userNickname === eventData.rejected_request.to_user
    ) {
      setIsVisibleDetail(false);
      addEvent(eventName, eventData.rejected_request);
      addEvent("update_contact_status_to_rejected", {
        request: eventData.rejected_request,
        new_status: eventData.rejected_request.status,
      });
      if (
        infoChatSelected?.contact_name === eventData?.rejected_request.from_user
      ) {
        setComponent("RejectedRequestSend");
      }
    }
    if (
      eventName === "open_rejected_request_received" &&
      eventData.rejected_request &&
      userNickname === eventData.rejected_request.from_user
    ) {
      setIsVisibleDetail(false);
      addEvent(eventName, eventData.rejected_request);
      addEvent("update_contact_status_to_rejected", {
        request: eventData.rejected_request,
        new_status: eventData.rejected_request.status,
      });
      if (
        infoChatSelected?.contact_name === eventData?.rejected_request.to_user
      ) {
        setComponent("RejectedRequestReceived");
      }
    }
  }, [eventData.rejected_request]);

  useEffect(() => {
    if (eventName === "update_contact_status_to_accepted" && eventData.request) {
      addEvent(eventName, { request: eventData.request, new_status: eventData.new_status || "" });
      setComponent("");
      addEvent("deselect_contact", {
        from_user: eventData.request.from_user,
        to_user: eventData.request.to_user,
      });
    }
  }, [eventData.request, eventData.new_status]);
}
