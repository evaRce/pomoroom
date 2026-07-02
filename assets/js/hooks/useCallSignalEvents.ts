import { useEffect } from "react";

type UseCallSignalingEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
};

// Routes incoming LiveView "react" events for the call system into EventContext.
// ICE candidates use a functional updater to APPEND to a queue rather than overwrite,
// since multiple candidates can arrive before React processes the previous one.
export function useCallSignalingEvents({
  eventName,
  eventData,
  addEvent,
}: UseCallSignalingEventsParams) {
  useEffect(() => {
    const handlers: Record<string, () => void> = {
      ice_candidate: () =>
        addEvent("ice_candidates", (prev: any[] | undefined) => [
          ...(prev ?? []),
          eventData,
        ]),
      room_users: () => addEvent("room_users", eventData),
      sdp_offer: () => addEvent("sdp_offer", eventData),
      sdp_answer: () => addEvent("sdp_answer", eventData),
    };

    handlers[eventName]?.();
  }, [eventName, eventData]);
}
