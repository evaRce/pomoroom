import React from "react";
import { Avatar } from "antd";
import type { ChatMessage, EventBusPayload } from "../../../../types/events";
import { linkifyText } from "../../../../utils/linkifyText";

interface MessageItemProps {
  message: ChatMessage;
  userLogin: EventBusPayload<"show_user_info"> | null;
  hideSenderIdentity?: boolean;
}

export default function MessageItem({
  message,
  userLogin,
  hideSenderIdentity = false,
}: MessageItemProps) {
  const setTime = (dateTime: string | number | Date) => {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isMyMessage = message.data.from_user === userLogin?.nickname;
  const messagePosition = isMyMessage ? "chat-end" : "chat-start";
  const bubbleClass = isMyMessage ? "message-bubble-mine" : "message-bubble-other";
  const isSystemMessage = ["pomodoro", "group_chat"].includes(message.data.from_user);

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2 landscape-sm:my-1">
        <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm text-center landscape-sm:px-2 landscape-sm:py-1 landscape-sm:text-xs">
          <div>{message.data.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat ${messagePosition} landscape-sm:mb-1`}>
      {!hideSenderIdentity && (
        <>
          <div className="chat-image avatar">
            <Avatar
              className="bg-gray-50/30 landscape-sm:!h-7 landscape-sm:!w-7"
              src={message.image_user}
              size={45}
            />
          </div>
          <div className="chat-header landscape-sm:!text-[10px] landscape-sm:!mb-0.5">{message.data.from_user}</div>
        </>
      )}
      <div className={`chat-bubble ${bubbleClass} landscape-sm:!text-xs landscape-sm:!px-2 landscape-sm:!py-1 landscape-sm:!min-h-0`}>
        {linkifyText(message.data.text)}
        <div className="message-time">
          <time className="text-xs landscape-sm:text-[10px]" dateTime={new Date(message.data.inserted_at).toISOString()}>
            {setTime(message.data.inserted_at)}
          </time>
        </div>
      </div>
    </div>
  );
}
