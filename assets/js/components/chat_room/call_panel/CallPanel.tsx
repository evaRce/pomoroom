import React from "react";
import { Button } from "antd";
import { Phone, PhoneOff } from "lucide-react";
import { useEventContext, useEvent } from "../EventContext";

interface CallPanelProps {
  chatId: string;
  chatName: string;
}

export default function CallPanel({ chatId, chatName }: CallPanelProps) {
  const { addEvent } = useEventContext();
  const livekitTokenEvent = useEvent("livekit_token");
  const activeCallChatId = livekitTokenEvent?.chat_id;
  const isThisChatInCall = !!activeCallChatId && activeCallChatId === chatId;
  const isAnotherChatInCall = !!activeCallChatId && activeCallChatId !== chatId;

  const handleClick = () => {
    if (isThisChatInCall) {
      addEvent("show_call_modal", true);
      return;
    }

    if (isAnotherChatInCall) return;

    addEvent("call_room_name", { chat_id: chatId, name: chatName });
    addEvent("join_room", { chat_id: chatId });
  };

  const title = isThisChatInCall
    ? "Mostrar sala"
    : isAnotherChatInCall
      ? "Ya estás en otra llamada"
      : "Entrar a la sala";

  return (
    <Button
      type="text"
      disabled={isAnotherChatInCall}
      className={`!h-9 !w-9 !rounded-lg ${isThisChatInCall ? "!bg-green-50 !text-green-600" : "text-gray-600 hover:!bg-gray-100"}`}
      icon={isAnotherChatInCall ? <PhoneOff className="h-[18px] w-[18px]" /> : <Phone className="h-[18px] w-[18px]" />}
      title={title}
      onClick={handleClick}
    />
  );
}