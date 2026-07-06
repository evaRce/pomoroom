import { useEffect } from "react";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
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
