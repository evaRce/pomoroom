import React, { useState, useEffect, useRef } from "react";
import { useEventContext } from "../EventContext";
import MessageItem from "./body/MessageItem";
import ChatHeader from "./header/ChatHeader";
import ChatFooter from "./footer/ChatFooter";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const { getEventData, removeEvent } = useEventContext();
  const messagesEndRef = useRef(null);
  const [userLogin, setUserLogin] = useState(null);

  useEffect(() => {
    const msgs = getEventData("show_list_messages");
    if (msgs) {
      setMessages(msgs.messages);
      removeEvent("show_list_messages");
    }
  }, [getEventData("show_list_messages")]);

  useEffect(() => {
    const msg = getEventData("show_message_to_send");
    if (msg) {
      addMessage(msg.message);
      removeEvent("show_message_to_send");
    }
  }, [getEventData("show_message_to_send")]);


  useEffect(() => {
    const user = getEventData("show_user_info")
    if (user) {
      setUserLogin(user);
    }
  }, [getEventData("show_user_info")]);

  const addMessage = (message) => {
    if (!message || !message.data || message.data.text.trim() === "") {
      return; // No añadir mensajes vacíos
    }
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-grow w-full border-l border-r">
      <ChatHeader userLogin={userLogin} />
      <main
        className="flex flex-col h-[83vh] overflow-y-auto overflow-x-hidden p-5 border-t border-b"
        style={{ scrollbarWidth: "thin" }}
        ref={messagesEndRef}
      >
        {messages.length > 0 &&
          messages.map((message) => (
            <MessageItem
              key={message?.data.msg_id}
              message={message}
              userLogin={userLogin}
            />
          ))}
        <div ref={messagesEndRef}></div>
      </main>
      <ChatFooter addMessage={addMessage} />
    </div>
  );
}
