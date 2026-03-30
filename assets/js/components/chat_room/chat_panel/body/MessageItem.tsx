import React from "react";
import { Avatar } from "antd";

interface MessageItemProps {
  message: any;
  userLogin: any;
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

  return (
    <div className={`chat ${messagePosition}`}>
      {!hideSenderIdentity && (
        <>
          <div className="chat-image avatar">
            <Avatar className="bg-gray-50/30" src={message.image_user} size={45} />
          </div>
          <div className="chat-header">{message.data.from_user}</div>
        </>
      )}
      <div className={`chat-bubble ${bubbleClass}`}>
        {message.data.text}
        <div className="message-time">
          <time className="text-xs">
            {setTime(message.data.inserted_at)}
          </time>
        </div>
      </div>
    </div>
  );
}
