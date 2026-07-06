import React from "react";
import { Button } from "antd";
import { Mic, MicOff, PhoneOff, MessageCircle } from "lucide-react";
import { useLocalParticipant } from "@livekit/components-react";
import { useCallContext } from "./CallContext";
import { useEventContext } from "../EventContext";
import callText from "./callText";

export default function MinimizedCallBar() {
  const {
    activeCallChatId,
    activeCallRoomName,
    activeCallIsGroupChat,
    isMinimized,
    viewingChatId,
    setMinimized,
    leaveCall,
  } = useCallContext();
  const { addEvent } = useEventContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const isCallScreenVisible = !!activeCallChatId && activeCallChatId === viewingChatId && !isMinimized;

  if (!activeCallChatId || isCallScreenVisible) return null;

  const isSameChat = activeCallChatId === viewingChatId;
  const canNavigateToCall = !isSameChat && !!activeCallRoomName;

  const handleBarClick = () => {
    if (isSameChat) {
      setMinimized(false);
      return;
    }

    if (canNavigateToCall) {
      if (activeCallIsGroupChat) {
        addEvent("selected_group_chat", { group_name: activeCallRoomName });
      } else {
        addEvent("selected_private_chat", { contact_name: activeCallRoomName });
      }
      setMinimized(false);
    }
  };

  const stop = (event: React.MouseEvent) => event.stopPropagation();
  const isClickable = isSameChat || canNavigateToCall;

  return (
    <div
      role={isClickable ? "button" : undefined}
      onClick={isClickable ? handleBarClick : undefined}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg ${
        isClickable ? "cursor-pointer" : ""
      }`}
    >
      {isSameChat ? (
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-brand">
          <MessageCircle className="h-3 w-3" />
        </span>
      )}
      <span className="text-sm font-medium text-gray-700">
        {isSameChat
          ? activeCallRoomName
            ? callText.minibar.callWith(activeCallRoomName)
            : callText.minibar.callInProgress
          : callText.minibar.callActiveElsewhere}
      </span>
      <Button
        type="text"
        shape="circle"
        size="small"
        className={isMicrophoneEnabled ? "!text-gray-600 hover:!bg-gray-100" : "!bg-red-50 !text-red-600"}
        icon={isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        onClick={(event) => {
          stop(event);
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        }}
        title={isMicrophoneEnabled ? callText.screen.muteMic : callText.screen.unmuteMic}
      />
      <Button
        type="text"
        shape="circle"
        size="small"
        danger
        icon={<PhoneOff className="h-4 w-4" />}
        onClick={(event) => {
          stop(event);
          leaveCall();
        }}
        title={callText.screen.endCall}
      />
    </div>
  );
}