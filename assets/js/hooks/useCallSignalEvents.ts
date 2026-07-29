import { useEffect } from "react";
import { AddEvent, EventBusPayloads } from "../types/events";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: Record<string, unknown>;
  addEvent: AddEvent;
};

export function useCallSignalingEvents({
  eventName,
  eventData,
  addEvent,
}: UseCallSignalingEventsParams) {
  useEffect(() => {
    if (eventName === "livekit_token") {
      addEvent(eventName, eventData as unknown as EventBusPayloads["livekit_token"]);
    }
  }, [eventName, eventData.token, eventData.ws_url]);
}
