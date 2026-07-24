import React, { useState, useEffect, useRef } from "react";
import ChatPanel from "./chat_panel/ChatPanel";
import ChatDetailPanel from "./info_panel/ChatDetailPanel";
import BackGround from "./chat_panel/BackGround";
import { useEventContext } from "./EventContext";
import RequestReceived from "./contact_requests/RequestReceived";
import RequestSend from "./contact_requests/RequestSend";
import RejectedRequestSend from "./contact_requests/RejectedRequestSend";
import RejectedRequestReceived from "./contact_requests/RejectedRequestReceived";
import ConversationSidebar from "./conversation_sidebar/ConversationSidebar";
import { CallSessionProvider } from "./call_panel/CallContext";
import { useContactsAndGroupsOutgoingActions } from "../../hooks/useContactsAndGroupsOutgoingActions";
import { usePomodoroOutgoingActions } from "../../hooks/usePomodoroOutgoingActions";
import { useKanbanOutgoingActions } from "../../hooks/useKanbanOutgoingActions";
import { useMessageOutgoingActions } from "../../hooks/useMessageOutgoingActions";
import { useChatPluginOutgoingActions } from "../../hooks/useChatPluginOutgoingActions";
import { useCallOutgoingActions } from "../../hooks/useCallOutgoingActions";
import { useUserContactsAndGroupsEvents } from "../../hooks/useUserContactsAndGroupsEvents";
import { useChatSessionEvents } from "../../hooks/useChatSessionEvents";
import { useFriendRequestEvents } from "../../hooks/useFriendRequestEvents";
import { useCallSignalingEvents } from "../../hooks/useCallSignalEvents";
import { useGroupMembershipEvents } from "../../hooks/useGroupMemberEvents";
import { useErrorNotificationEvents } from "../../hooks/useErrorNotificationEvents";
import { getRandomBackgroundImageNumber } from "../../utils/randomBackgroundImage";
export interface ChatRoomProps {
  eventName: string;
  eventData: any;
  pushEventToLiveView(event: string, payload: object): any;
}

export const ChatRoom: React.FC<ChatRoomProps> = (props: ChatRoomProps) => {
  const { eventName, eventData, pushEventToLiveView } = props;
  const { addEvent, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [userNickname, setUserNickname] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState({});
  const hasRequestedInitialData = useRef(false);

  useEffect(() => {
    setImageNumber(getRandomBackgroundImageNumber());
    if (!hasRequestedInitialData.current) {
      pushEventToLiveView("action.get_user_info", {});
      pushEventToLiveView("action.get_list_contact", {});
      hasRequestedInitialData.current = true;
    }
  }, []);

  useContactsAndGroupsOutgoingActions({
    removeEvent,
    pushEventToLiveView,
    infoChatSelected,
    isVisibleDetail,
    setIsVisibleDetail,
    setInfoChatSelected,
    setComponent,
  });

  usePomodoroOutgoingActions({
    removeEvent,
    pushEventToLiveView,
  });

  useKanbanOutgoingActions({
    removeEvent,
    pushEventToLiveView,
  });

  useMessageOutgoingActions({
    removeEvent,
    pushEventToLiveView,
  });

  useChatPluginOutgoingActions({
    removeEvent,
    pushEventToLiveView,
  });

  useCallOutgoingActions({
    removeEvent,
    pushEventToLiveView,
  });

  useUserContactsAndGroupsEvents({
    eventName,
    eventData,
    addEvent,
    setUserNickname,
  });

  useChatSessionEvents({
    eventName,
    eventData,
    addEvent,
    userNickname,
    setComponent,
  });

  useFriendRequestEvents({
    eventName,
    eventData,
    addEvent,
    userNickname,
    setIsVisibleDetail,
    setComponent,
    infoChatSelected,
  });

  useGroupMembershipEvents({
    eventName,
    eventData,
    addEvent,
    removeEvent,
  });

  useCallSignalingEvents({
    eventName,
    eventData,
    addEvent,
  });

  useErrorNotificationEvents({
    eventName,
    eventData,
  });

  return (
    <CallSessionProvider>
      <div className="flex h-screen w-screen min-h-screen md:min-h-48 overflow-x-hidden">
        <ConversationSidebar />
        {component === "ChatPanel" && (
          <ChatPanel isVisibleDetail={isVisibleDetail} />
        )}
        {component === "RequestSend" && <RequestSend imageNumber={imageNumber} />}
        {component === "RequestReceived" && (
          <RequestReceived imageNumber={imageNumber} />
        )}
        {component === "RejectedRequestSend" && (
          <RejectedRequestSend imageNumber={imageNumber} />
        )}
        {component === "RejectedRequestReceived" && (
          <RejectedRequestReceived imageNumber={imageNumber} />
        )}
        {component === "" && <BackGround imageNumber={imageNumber} />}
        {isVisibleDetail === true && <ChatDetailPanel />}
      </div>
    </CallSessionProvider>
  );
};
