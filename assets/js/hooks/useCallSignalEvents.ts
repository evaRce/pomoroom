import { useEffect } from "react";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
  userName: string;
};

export function useCallSignalingEvents({
  eventName,
  eventData,
  addEvent,
  userName,
}: UseCallSignalingEventsParams) {
  useEffect(() => {
    if (eventName === "connected_users") {
      addEvent("connected_users", eventData.connected_users);
    }
  }, [eventData.connected_users]);

  useEffect(() => {
    if (eventName === "offer_requests") {
      console.log("[", userName, "]OFFER REq llego");
      addEvent(eventName, eventData.offer_requests);
    }
  }, [eventData.offer_requests]);

  useEffect(() => {
    if (eventName === "receive_ice_candidate_offers") {
      console.log("[", userName, "] receive_ice_candidate_offers llego");
      addEvent(eventName, eventData.ice_candidate_offers);
    }
  }, [eventData.ice_candidate_offers]);

  useEffect(() => {
    if (eventName === "receive_sdp_offers") {
      console.log("[", userName, "] receive_sdp_offers llego");
      addEvent(eventName, eventData.sdp_offer);
    }
  }, [eventData.sdp_offer]);

  useEffect(() => {
    if (eventName === "receive_answers") {
      console.log("[", userName, "] receive_answers  llego");
      addEvent(eventName, eventData.answers);
    }
  }, [eventData.answers]);
}
