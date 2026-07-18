import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, message } from "antd";
import EmojiPicker from "emoji-picker-react";
import {
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useEventContext, useEvent } from "../../EventContext";

export default function ChatFooter() {
  const [inputStr, setInputStr] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { addEvent, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [isGroupMemberRemoved, setIsGroupMemberRemoved] = useState(false);
  const [groupMemberRemovedMessage, setGroupMemberRemovedMessage] = useState("");
  const lastProcessedGroupMemberRemovedEventSignatureRef = useRef("");
  const lastProcessedGroupMemberAddedEventSignatureRef = useRef("");

  const openPrivateChatEvent = useEvent("open_private_chat");
  const activeChatContextEvent = useEvent("active_chat_context");
  const openGroupChatEvent = useEvent("open_group_chat");
  const groupMemberRemovedEvent = useEvent("group_member_removed");
  const groupMemberAddedEvent = useEvent("group_member_added");

  const onEmojiClick = (emojiObject: any, event: any) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  const buildRemovedMessage = (groupName?: string) =>
    groupName
      ? `Has sido eliminado del grupo ${groupName}`
      : "Has sido eliminado del grupo";

  useEffect(() => {
    if (openPrivateChatEvent) {
      setChatData(openPrivateChatEvent);
      removeEvent("open_private_chat");
    }
  }, [openPrivateChatEvent]);

  useEffect(() => {
    if (activeChatContextEvent) {
      setChatData(activeChatContextEvent);
      setIsGroupMemberRemoved(Boolean(activeChatContextEvent.removed_at));
      setGroupMemberRemovedMessage(
        activeChatContextEvent.removed_at
          ? buildRemovedMessage(activeChatContextEvent.group_data?.name)
          : ""
      );
    }
  }, [activeChatContextEvent]);

  useEffect(() => {
    if (openGroupChatEvent) {
      setChatData(openGroupChatEvent);
      setIsGroupMemberRemoved(Boolean(openGroupChatEvent.removed_at));
      setGroupMemberRemovedMessage(
        openGroupChatEvent.removed_at ? buildRemovedMessage(openGroupChatEvent.group_data?.name) : ""
      );
      removeEvent("open_group_chat");
    }
  }, [openGroupChatEvent]);

  useEffect(() => {
    if (!groupMemberRemovedEvent) return;

    const removedEventSignature = `${groupMemberRemovedEvent.chat_id || ""}:${groupMemberRemovedEvent.group_name || ""}:${groupMemberRemovedEvent.removed_at || ""}`;

    if (lastProcessedGroupMemberRemovedEventSignatureRef.current === removedEventSignature) return;

    const isSameChatById =
      chatData?.chat_id &&
      groupMemberRemovedEvent.chat_id &&
      chatData.chat_id === groupMemberRemovedEvent.chat_id;

    if (isSameChatById) {
      lastProcessedGroupMemberRemovedEventSignatureRef.current = removedEventSignature;
      setIsGroupMemberRemoved(true);
      setGroupMemberRemovedMessage(buildRemovedMessage(groupMemberRemovedEvent.group_name));
    }
  }, [groupMemberRemovedEvent]);

  useEffect(() => {
    if (!groupMemberAddedEvent) return;

    const addedEventSignature = `${groupMemberAddedEvent.chat_id || ""}:${groupMemberAddedEvent.group_name || ""}:${groupMemberAddedEvent.message || ""}`;

    if (lastProcessedGroupMemberAddedEventSignatureRef.current === addedEventSignature) return;

    const isSameChatById =
      chatData?.chat_id &&
      groupMemberAddedEvent.chat_id &&
      chatData.chat_id === groupMemberAddedEvent.chat_id;

    if (isSameChatById) {
      lastProcessedGroupMemberAddedEventSignatureRef.current = addedEventSignature;
      setIsGroupMemberRemoved(false);
      setGroupMemberRemovedMessage("");
      addEvent("selected_group_chat", {
        group_name: chatData.group_data?.name || groupMemberAddedEvent.group_name,
      });
      if (groupMemberAddedEvent.message) {
        message.success(groupMemberAddedEvent.message);
      }
    }
  }, [groupMemberAddedEvent]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();

    const currentData = chatData?.chat_id ? chatData : activeChatContextEvent || chatData;

    if (isGroupMemberRemoved && currentData?.group_data) {
      return;
    }

    if (inputStr.trim() === "") {
      return;
    }

    if (currentData?.group_data) {
      addEvent("send_message", {
        message: inputStr,
        to_group_name: currentData?.group_data?.name,
      });
    } else if (currentData?.to_user_data) {
      addEvent("send_message", {
        message: inputStr,
        to_user: currentData.to_user_data.nickname,
      });
    }

    setInputStr("");
  };

  const footerPadding = isGroupMemberRemoved && chatData.group_data ? "px-0 py-0" : "px-3 py-2 sm:px-4 sm:py-3";
  return (
    <footer className={`shrink-0 flex min-h-16 justify-between ${isGroupMemberRemoved && chatData.group_data ? '' : 'bg-gray-300'} ${footerPadding}`}>
      {isGroupMemberRemoved && chatData.group_data ? (
        <div className="flex h-full w-full items-center justify-center bg-yellow-300 text-yellow-900 text-2xl font-bold tracking-wide" style={{ padding: 0, borderRadius: 0 }}>
          <span className="mx-3" role="img" aria-label="warning">⚠️</span>
          {groupMemberRemovedMessage}
        </div>
      ) : (
        <form className="flex w-full gap-3" onSubmit={handleSendMessage}>
          <div className="flex items-center w-full justify-center">
            <input
              className="input bg-gray-100 h-8 w-full focus:outline-none rounded-r-none"
              type="text"
              value={inputStr}
              onChange={(e) => {
                if (e.target.value.length <= 5000) {
                  setInputStr(e.target.value);
                } else {
                  setModalVisible(true);
                }
              }}
              placeholder="Type a message..."
              maxLength={5001}
            />
            <div className="flex">
              <Button
                className="bg-gray-100 rounded-none"
                onClick={() => setShowPicker(true)}
                icon={<SmileOutlined />}
              />
              <Button
                className="bg-sky-400 rounded-l-none rounded-r-lg"
                icon={<SendOutlined />}
                onClick={(e) => handleSendMessage(e)}
              />
            </div>
          </div>
        </form>
      )}
      <Modal
        title="Elige los emojis"
        open={showPicker}
        onCancel={() => setShowPicker(false)}
        footer={null}
        width={400}
        centered
      >
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </Modal>
      <Modal
        title="Límite de caracteres excedido"
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <p>Se ha excedido el límite de 5000 caracteres.</p>
      </Modal>
    </footer>
  );
}
