import React, { useState, useEffect, useRef } from "react";
import { Button } from "antd";
import { ArrowLeft } from "lucide-react";
import ChatPanel from "./chat_panel/ChatPanel";
import ChatDetailPanel from "./info_panel/ChatDetailPanel";
import BackGround from "./chat_panel/BackGround";
import { useEventContext, useEvent } from "./EventContext";
import RequestReceived from "./contact_requests/RequestReceived";
import RequestSend from "./contact_requests/RequestSend";
import RejectedRequestSend from "./contact_requests/RejectedRequestSend";
import RejectedRequestReceived from "./contact_requests/RejectedRequestReceived";
import ConversationSidebar from "./conversation_sidebar/ConversationSidebar";
import { CallSessionProvider } from "./call_panel/CallContext";
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
  const { addEvent, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [userNickname, setUserNickname] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState({});
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const hasRequestedInitialData = useRef(false);
  const mobileOpenChatEvent = useEvent("mobile_open_chat");

  useEffect(() => {
    if (mobileOpenChatEvent) {
      setMobileShowChat(true);
      removeEvent("mobile_open_chat");
    }
  }, [mobileOpenChatEvent]);

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

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

  return (
    <CallSessionProvider>
      <div className="flex h-dvh w-screen min-h-dvh md:min-h-48 overflow-hidden">
        <ConversationSidebar mobileHidden={mobileShowChat} />
        <div className={`${mobileShowChat && !isVisibleDetail ? "flex" : "hidden"} sm:flex h-dvh flex-1 min-w-0 flex-col relative`}>
          {component !== "ChatPanel" && (
            <Button
              className="sm:hidden absolute top-4 left-4 z-10 shadow bg-white"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBackToList}
              size="large"
              title="Volver"
            />
          )}
          <div className="flex flex-1 min-h-0 flex-col">
            {component === "ChatPanel" && (
              <ChatPanel isVisibleDetail={isVisibleDetail} onBack={handleBackToList} />
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
          </div>
        </div>
        {isVisibleDetail === true && <ChatDetailPanel />}
      </div>
    </CallSessionProvider>
  );
};
