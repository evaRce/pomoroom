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
import { useOutgoingLiveViewActions } from "../../hooks/useLiveViewActions";
import { useUserContactsAndGroupsEvents } from "../../hooks/useUserContactsAndGroupsEvents";
import { useChatSessionEvents } from "../../hooks/useChatSessionEvents";
import { useFriendRequestEvents } from "../../hooks/useFriendRequestEvents";
import { useCallSignalingEvents } from "../../hooks/useCallSignalEvents";
import { useGroupMembershipEvents } from "../../hooks/useGroupMemberEvents";
export interface ChatRoomProps {
  eventName: string;
  eventData: any;
  pushEventToLiveView(event: string, payload: object): any;
}

export const ChatRoom: React.FC<ChatRoomProps> = (props: ChatRoomProps) => {
  const { eventName, eventData, pushEventToLiveView } = props;
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [userName, setUserName] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState({});
  const hasRequestedInitialData = useRef(false);

  useEffect(() => {
    const randomImageNumber = Math.floor(Math.random() * 5) + 1;
    setImageNumber(randomImageNumber);
    if (!hasRequestedInitialData.current) {
      pushEventToLiveView("action.get_user_info", {});
      pushEventToLiveView("action.get_list_contact", {});
      hasRequestedInitialData.current = true;
    }
  }, []);

  useOutgoingLiveViewActions({
    getEventData,
    removeEvent,
    pushEventToLiveView,
    infoChatSelected,
    isVisibleDetail,
    setIsVisibleDetail,
    setInfoChatSelected,
    setComponent,
  });

  useUserContactsAndGroupsEvents({
    eventName,
    eventData,
    addEvent,
    setUserName,
  });

  useChatSessionEvents({
    eventName,
    eventData,
    addEvent,
    isVisibleDetail,
    userName,
    setComponent,
  });

  useFriendRequestEvents({
    eventName,
    eventData,
    addEvent,
    userName,
    setIsVisibleDetail,
    setComponent,
    infoChatSelected,
  });

  useGroupMembershipEvents({
    eventName,
    eventData,
    addEvent,
  });

  useCallSignalingEvents({
    eventName,
    eventData,
    addEvent,
    userName,
  });

  return (
    <div className="flex h-screen w-screen min-h-screen md:min-h-48 overflow-x-hidden">
      <ConversationSidebar />
      {component === "ChatPanel" && <ChatPanel />}
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
  );
};
