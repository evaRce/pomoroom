import React, { useState, useEffect, useRef } from "react";
import { useEventContext } from "../EventContext";
import MessageItem from "./body/MessageItem";
import ChatHeader from "./header/ChatHeader";
import ChatFooter from "./footer/ChatFooter";

interface ChatPanelProps {
  isVisibleDetail: boolean;
}

const TOP_SCROLL_THRESHOLD_PX = 12;

export default function ChatPanel({ isVisibleDetail }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const { addEvent, getEventData, removeEvent } = useEventContext() as any;
  const messagesEndRef = useRef<any>(null);
  const seenMessageIdsRef = useRef<Set<any>>(new Set());
  const previousScrollHeightRef = useRef(0);
  const isPrependingOlderRef = useRef(false);
  const [userLogin, setUserLogin] = useState<any>(null);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const getMessageUniqueKey = (message: any) => {
    const data = message?.data || {};

    if (data.db_id) {
      return `db:${data.db_id}`;
    }

    return `msg:${data.msg_id || ""}:${data.inserted_at || ""}:${data.from_user || ""}:${data.text || ""}`;
  };

  const buildUniqueMessagesAndSeedIds = (messagesList: any[]) => {
    const seenMessageIds = new Set<any>();
    const uniqueMessages: any[] = [];

    for (const message of messagesList) {
      const messageId = getMessageUniqueKey(message);

      if (!messageId) {
        continue;
      }

      if (!seenMessageIds.has(messageId)) {
        seenMessageIds.add(messageId);
        uniqueMessages.push(message);
      }
    }

    seenMessageIdsRef.current = seenMessageIds;
    return uniqueMessages;
  };

  useEffect(() => {
    const msgs = getEventData("show_list_messages");
    if (msgs) {
      setMessages(buildUniqueMessagesAndSeedIds(msgs.messages || []));
      setCurrentChatId(msgs.chat_id || "");
      const hasMoreFromServer = typeof msgs.has_more === "boolean" ? msgs.has_more : false;
      setHasMoreOlder(hasMoreFromServer);
      setIsLoadingOlder(false);
      removeEvent("show_list_messages");
    }
  }, [getEventData("show_list_messages")]);

  useEffect(() => {
    const olderMessagesPayload = getEventData("show_older_messages");

    if (olderMessagesPayload) {
      const olderMessages = olderMessagesPayload.messages || [];
      const hasMore = Boolean(olderMessagesPayload.has_more);

      if (olderMessages.length > 0) {
        const container = messagesEndRef.current;
        if (container) {
          previousScrollHeightRef.current = container.scrollHeight;
          isPrependingOlderRef.current = true;
        }

        setMessages((prevMessages) =>
          buildUniqueMessagesAndSeedIds([...olderMessages, ...prevMessages])
        );
      }

      setHasMoreOlder(hasMore);
      setIsLoadingOlder(false);
      removeEvent("show_older_messages");
    }
  }, [getEventData("show_older_messages")]);

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

  const addMessage = (message: any) => {
    if (!message || !message.data || message.data.text.trim() === "") {
      return; // No añadir mensajes vacíos
    }

    const messageId = getMessageUniqueKey(message);
    if (!messageId) {
      return;
    }

    if (messageId && seenMessageIdsRef.current.has(messageId)) {
      return;
    }

    seenMessageIdsRef.current.add(messageId);

    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const requestOlderMessages = () => {
    if (isLoadingOlder || !hasMoreOlder || !currentChatId || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    const oldestInsertedAt = oldestMessage?.data?.inserted_at;
    const oldestDbId = oldestMessage?.data?.db_id;

    if (!oldestInsertedAt) {
      return;
    }

    setIsLoadingOlder(true);
    addEvent("load_older_messages", {
      chat_id: currentChatId,
      before_inserted_at: oldestInsertedAt,
      before_db_id: oldestDbId,
    });
  };

  const handleMessagesScroll = (event: any) => {
    const target = event.currentTarget;

    if (target.scrollTop <= TOP_SCROLL_THRESHOLD_PX) {
      requestOlderMessages();
    }
  };

  useEffect(() => {
    const container = messagesEndRef.current;
    if (!container) {
      return;
    }

    if (isPrependingOlderRef.current) {
      const newScrollHeight = container.scrollHeight;
      const deltaHeight = newScrollHeight - previousScrollHeightRef.current;
      container.scrollTop = deltaHeight;
      isPrependingOlderRef.current = false;
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col flex-grow w-full border-l border-r">
      <ChatHeader userLogin={userLogin} isVisibleDetail={isVisibleDetail} />
      <main
        className="flex flex-col h-[83vh] overflow-y-auto overflow-x-hidden p-5 border-t border-b"
        style={{ scrollbarWidth: "thin" }}
        ref={messagesEndRef}
        onScroll={handleMessagesScroll}
      >
        {messages.length > 0 &&
          messages.map((message) => (
            <MessageItem
              key={getMessageUniqueKey(message)}
              message={message}
              userLogin={userLogin}
            />
          ))}
        <div></div>
      </main>
      <ChatFooter addMessage={addMessage} />
    </div>
  );
}
