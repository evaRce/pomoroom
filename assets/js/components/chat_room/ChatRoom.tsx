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
import { useContactsAndGroupsOutgoingActions, InfoChatSelected } from "../../hooks/outgoing_actions/useContactsAndGroupsOutgoingActions";
import { usePomodoroOutgoingActions } from "../../hooks/outgoing_actions/usePomodoroOutgoingActions";
import { useKanbanOutgoingActions } from "../../hooks/outgoing_actions/useKanbanOutgoingActions";
import { useMessageOutgoingActions } from "../../hooks/outgoing_actions/useMessageOutgoingActions";
import { useChatPluginOutgoingActions } from "../../hooks/outgoing_actions/useChatPluginOutgoingActions";
import { useCallOutgoingActions } from "../../hooks/outgoing_actions/useCallOutgoingActions";
import { useUserContactsAndGroupsEvents } from "../../hooks/useUserContactsAndGroupsEvents";
import { useChatSessionEvents } from "../../hooks/useChatSessionEvents";
import { useFriendRequestEvents } from "../../hooks/useFriendRequestEvents";
import { useCallSignalingEvents } from "../../hooks/useCallSignalEvents";
import { useGroupMembershipEvents } from "../../hooks/useGroupMemberEvents";
import { useErrorNotificationEvents } from "../../hooks/useErrorNotificationEvents";
import { getRandomBackgroundImageNumber } from "../../utils/randomBackgroundImage";
import { PushEventToLiveView } from "../../types/events";
import useChatRoomText from "./chatRoomText";
export interface ChatRoomProps {
  eventName: string;
  eventData: Record<string, unknown>;
  pushEventToLiveView: PushEventToLiveView;
}

export const ChatRoom: React.FC<ChatRoomProps> = (props: ChatRoomProps) => {
  const { eventName, eventData, pushEventToLiveView } = props;
  const chatRoomText = useChatRoomText();
  const { addEvent, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [userNickname, setUserNickname] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState<InfoChatSelected>({});
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
      <div className="flex h-dvh w-screen min-h-dvh md:min-h-48 overflow-hidden">
        <ConversationSidebar mobileHidden={mobileShowChat} />
        <div className={`${mobileShowChat && !isVisibleDetail ? "flex" : "hidden"} sm:flex h-dvh flex-1 min-w-0 flex-col relative`}>
          {component !== "ChatPanel" && (
            <Button
              className="sm:hidden absolute top-4 left-4 z-10 shadow bg-white"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBackToList}
              size="large"
              title={chatRoomText.back}
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
