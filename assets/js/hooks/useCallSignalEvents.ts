import { useEffect } from "react";
import { AddEvent } from "../types/events";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: AddEvent;
};

export function useCallSignalingEvents({
  eventName,
  eventData,
  addEvent,
}: UseCallSignalingEventsParams) {
  useEffect(() => {
    if (eventName === "livekit_token") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.token, eventData.ws_url]);
}
