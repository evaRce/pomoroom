import { useEffect } from "react";
import { useEvent } from "../components/chat_room/EventContext";

type UseCallOutgoingActionsParams = {
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
};

export function useCallOutgoingActions({
  removeEvent,
  pushEventToLiveView,
}: UseCallOutgoingActionsParams) {
  const joinRoom = useEvent("join_room");

  useEffect(() => {
    if (joinRoom) {
      pushEventToLiveView("action.join_room", joinRoom);
      removeEvent("join_room");
    }
  }, [joinRoom, pushEventToLiveView, removeEvent]);
}
