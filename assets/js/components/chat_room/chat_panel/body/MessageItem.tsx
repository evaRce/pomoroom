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

  const messagePosition =
    message.data.from_user === userLogin.nickname ? "chat-end" : "chat-start";

  return (
    <div className={`chat ${messagePosition}`}>
      {!hideSenderIdentity && (
        <>
          <div className="chat-image avatar">
            <Avatar className="bg-gray-50" src={message.image_user} size={45} />
          </div>
          <div className="chat-header">{message.data.from_user}</div>
        </>
      )}
      <div
        className="chat-bubble"
        style={{ maxWidth: "70%", wordWrap: "break-word" }}
      >
        {message.data.text}
        <div style={{ textAlign: "right" }}>
          <time className="text-xs opacity-50">
            {setTime(message.data.inserted_at)}
          </time>
        </div>
      </div>
    </div>
  );
}
