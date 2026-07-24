import { useEffect } from "react";
import { useEvent } from "../../components/chat_room/EventContext";

type UseMessageOutgoingActionsParams = {
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
};

export function useMessageOutgoingActions({
  removeEvent,
  pushEventToLiveView,
}: UseMessageOutgoingActionsParams) {
  const sendMessage = useEvent("send_message");
  const loadOlderMessages = useEvent("load_older_messages");

  useEffect(() => {
    if (sendMessage) {
      pushEventToLiveView("action.send_message", sendMessage);
      removeEvent("send_message");
    }
    if (loadOlderMessages) {
      pushEventToLiveView("action.load_older_messages", loadOlderMessages);
      removeEvent("load_older_messages");
    }
  }, [sendMessage, loadOlderMessages, pushEventToLiveView, removeEvent]);
}
