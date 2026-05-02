import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, message } from "antd";
import EmojiPicker from "emoji-picker-react";
import {
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useEventContext } from "../../EventContext";

export default function ChatFooter() {
  const [inputStr, setInputStr] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [isGroupMemberRemoved, setIsGroupMemberRemoved] = useState(false);
  const [groupMemberRemovedMessage, setGroupMemberRemovedMessage] = useState("");
  const lastProcessedGroupMemberRemovedEventSignatureRef = useRef("");
  const lastProcessedGroupMemberAddedEventSignatureRef = useRef("");
  const onEmojiClick = (emojiObject: any, event: any) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  const buildRemovedMessage = (groupName?: string) =>
    groupName
      ? `Has sido eliminado del grupo ${groupName}`
      : "Has sido eliminado del grupo";

  useEffect(() => {
    const privateChat = getEventData("open_private_chat");

    if (privateChat) {
      setChatData(privateChat);
      removeEvent("open_private_chat");
    }
  }, [getEventData("open_private_chat")]);

  useEffect(() => {
    const activeChatContext = getEventData("active_chat_context");

    if (activeChatContext) {
      setChatData(activeChatContext);
      setIsGroupMemberRemoved(Boolean(activeChatContext.removed_at));
      setGroupMemberRemovedMessage(
        activeChatContext.removed_at
          ? buildRemovedMessage(activeChatContext.group_data?.name)
          : ""
      );
    }
  }, [getEventData("active_chat_context")]);

  useEffect(() => {
      const groupChat = getEventData("open_group_chat");

    if (groupChat) {
      setChatData(groupChat);
      setIsGroupMemberRemoved(Boolean(groupChat.removed_at));
      setGroupMemberRemovedMessage(
        groupChat.removed_at ? buildRemovedMessage(groupChat.group_data?.name) : ""
      );
      removeEvent("open_group_chat");
    }
  }, [getEventData("open_group_chat")]);

  useEffect(() => {
    const groupMemberRemovedEvent = getEventData("group_member_removed");

    if (!groupMemberRemovedEvent) {
      return;
    }

    const removedEventSignature = `${groupMemberRemovedEvent.chat_id || ""}:${groupMemberRemovedEvent.group_name || ""}:${groupMemberRemovedEvent.removed_at || ""}`;

    if (lastProcessedGroupMemberRemovedEventSignatureRef.current === removedEventSignature) {
      return;
    }

    const isSameChatById =
      groupMemberRemovedEvent &&
      chatData?.chat_id &&
      groupMemberRemovedEvent.chat_id &&
      chatData.chat_id === groupMemberRemovedEvent.chat_id;

    if (groupMemberRemovedEvent && isSameChatById) {
      lastProcessedGroupMemberRemovedEventSignatureRef.current = removedEventSignature;
      setIsGroupMemberRemoved(true);
      setGroupMemberRemovedMessage(buildRemovedMessage(groupMemberRemovedEvent.group_name));
    }
  }, [getEventData("group_member_removed")]);

  useEffect(() => {
    const groupMemberAddedEvent = getEventData("group_member_added");

    if (!groupMemberAddedEvent) {
      return;
    }

    const addedEventSignature = `${groupMemberAddedEvent.chat_id || ""}:${groupMemberAddedEvent.group_name || ""}:${groupMemberAddedEvent.message || ""}`;

    if (lastProcessedGroupMemberAddedEventSignatureRef.current === addedEventSignature) {
      return;
    }

    const isSameChatById =
      groupMemberAddedEvent &&
      chatData?.chat_id &&
      groupMemberAddedEvent.chat_id &&
      chatData.chat_id === groupMemberAddedEvent.chat_id;

    if (groupMemberAddedEvent && isSameChatById) {
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
  }, [getEventData("group_member_added")]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();

    const activeChatContext = getEventData("active_chat_context");
    const currentData = chatData?.chat_id ? chatData : activeChatContext || chatData;

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
        <div className="flex h-full w-full items-center justify-center bg-yellow-300 text-yellow-900 text-2xl font-bold tracking-wide" style={{padding: 0, borderRadius: 0}}>
          <span className="mx-3" role="img" aria-label="warning">⚠️</span>
          {groupMemberRemovedMessage}
        </div>
      ) : (
        <form className="flex w-full gap-3" onSubmit={handleSendMessage}>
          <div className="flex items-center gap-2">
            <Button className="bg-gray-100" icon={<PictureOutlined />} />
          </div>
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
