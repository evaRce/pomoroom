import { useEffect } from "react";
import { useEvent } from "../../components/chat_room/EventContext";
import { PushEventToLiveView, RemoveEvent } from "../../types/events";

type UseCallOutgoingActionsParams = {
  removeEvent: RemoveEvent;
  pushEventToLiveView: PushEventToLiveView;
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
