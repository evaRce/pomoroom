import React from "react";
import { Button } from "antd";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useLocalParticipant } from "@livekit/components-react";
import { useCallContext } from "./CallContext";
import { useEventContext } from "../EventContext";
import callText from "./callText";
import { selectPrivateChatAction } from "../../../services/contactService";
import { selectGroupChatAction } from "../../../services/groupService";

export default function MinimizedCallBar() {
  const {
    activeCallChatId,
    activeCallRoomName,
    activeCallIsGroupChat,
    viewingChatId,
    setMinimized,
    leaveCall,
  } = useCallContext();
  const { addEvent } = useEventContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  if (!activeCallChatId) return null;

  const isSameChat = activeCallChatId === viewingChatId;
  const canNavigateToCall = !isSameChat && !!activeCallRoomName;

  const handleBarClick = () => {
    if (isSameChat) {
      setMinimized(false);
      return;
    }

    if (canNavigateToCall) {
      if (activeCallIsGroupChat) {
        selectGroupChatAction(addEvent, activeCallRoomName);
      } else {
        selectPrivateChatAction(addEvent, activeCallRoomName);
      }
      setMinimized(false);
    }
  };

  const stop = (event: React.MouseEvent) => event.stopPropagation();
  const isClickable = isSameChat || canNavigateToCall;

  return (
    <div className="mx-2 my-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2">
      <div
        role={isClickable ? "button" : undefined}
        onClick={isClickable ? handleBarClick : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 ${isClickable ? "cursor-pointer" : ""}`}
      >
        <p className="m-0 flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm leading-none">
          <span className="font-semibold text-green-700">{callText.minibar.callInProgress}</span>
          {activeCallRoomName && (
            <>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 animate-pulse" />
              <span className="truncate text-gray-500">{activeCallRoomName}</span>
            </>
          )}
        </p>
      </div>
      <Button
        shape="circle"
        className={`!flex !h-9 !w-9 !items-center !justify-center !p-0 ${isMicrophoneEnabled ? "!border-gray-300 !bg-white !text-gray-700 hover:!bg-gray-100" : "!border-red-200 !bg-red-50 !text-red-600"}`}
        icon={isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        onClick={(event) => {
          stop(event);
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        }}
        title={isMicrophoneEnabled ? callText.screen.muteMic : callText.screen.unmuteMic}
        aria-label={isMicrophoneEnabled ? callText.screen.muteMic : callText.screen.unmuteMic}
      />
      <Button
        shape="circle"
        className="!flex !h-9 !w-9 !items-center !justify-center !p-0"
        danger
        type="primary"
        icon={<PhoneOff className="h-4 w-4" />}
        onClick={(event) => {
          stop(event);
          leaveCall();
        }}
        title={callText.screen.endCall}
        aria-label={callText.screen.endCall}
      />
    </div>
  );
}