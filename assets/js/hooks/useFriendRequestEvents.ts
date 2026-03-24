import { useEffect } from "react";

type UseFriendRequestEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
  userName: string;
  setIsVisibleDetail: (value: boolean) => void;
  setComponent: (value: string) => void;
  infoChatSelected: any;
};

export function useFriendRequestEvents({
  eventName,
  eventData,
  addEvent,
  userName,
  setIsVisibleDetail,
  setComponent,
  infoChatSelected,
}: UseFriendRequestEventsParams) {
  useEffect(() => {
    if (
      eventName === "open_chat_request_send" &&
      userName === eventData.request.from_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestSend");
    }
    if (
      eventName === "open_chat_request_received" &&
      userName === eventData.request.to_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestReceived");
    }
  }, [eventData.request]);

  useEffect(() => {
    if (
      eventName === "open_rejected_request_send" &&
      userName === eventData.rejected_request.to_user
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
      userName === eventData.rejected_request.from_user
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
    if (eventName === "update_contact_status_to_accepted") {
      addEvent(eventName, eventData);
      setComponent("");
      addEvent("deselect_contact", {
        from_user: eventData.request.from_user,
        to_user: eventData.request.to_user,
      });
    }
  }, [eventData.request, eventData.new_status]);
}
