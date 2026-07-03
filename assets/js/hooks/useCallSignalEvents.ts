import { useEffect } from "react";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
};

// Routes the incoming LiveView "react" event carrying the LiveKit access token
// (pushed by Calls.handle_join_room) into EventContext, where CallPanel reads it.
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
