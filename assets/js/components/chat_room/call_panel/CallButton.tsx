import React from "react";
import { Button } from "antd";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { useCallContext } from "./CallContext";
import callText from "./callText";

interface CallButtonProps {
  chatId: string;
  chatName: string;
  isGroupChat: boolean;
}

export default function CallButton({ chatId, chatName, isGroupChat }: CallButtonProps) {
  const { activeCallChatId, connectingChatId, setMinimized, joinCall } = useCallContext();
  const isThisChatInCall = !!activeCallChatId && activeCallChatId === chatId;
  const isThisChatConnecting = !activeCallChatId && connectingChatId === chatId;
  const isBusyElsewhere =
    (!!activeCallChatId && activeCallChatId !== chatId) || (!!connectingChatId && connectingChatId !== chatId);

  const handleClick = () => {
    if (isThisChatInCall) {
      setMinimized(false);
      return;
    }

    if (isBusyElsewhere || isThisChatConnecting) return;

    joinCall(chatId, chatName, isGroupChat);
  };

  const title = isThisChatInCall
    ? callText.button.showRoom
    : isBusyElsewhere
      ? callText.button.anotherCallActive
      : isThisChatConnecting
        ? callText.button.connecting
        : callText.button.joinRoom;

  return (
    <Button
      type="text"
      disabled={isBusyElsewhere || isThisChatConnecting}
      className={`!h-9 !w-9 !rounded-lg ${isThisChatInCall ? "!bg-green-50 !text-green-600" : "text-gray-600 hover:!bg-gray-100"}`}
      icon={
        isBusyElsewhere ? (
          <PhoneOff className="h-[18px] w-[18px]" />
        ) : isThisChatConnecting ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          <Phone className="h-[18px] w-[18px]" />
        )
      }
      title={title}
      aria-label={title}
      onClick={handleClick}
    />
  );
}
