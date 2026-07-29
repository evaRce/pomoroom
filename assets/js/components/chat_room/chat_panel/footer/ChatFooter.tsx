import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, message } from "antd";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useEventContext, useEvent } from "../../EventContext";
import { sendMessageToGroupAction, sendMessageToUserAction } from "../../../../services/messageService";
import { selectGroupChatAction } from "../../../../services/groupService";
import type { ChatSessionData } from "../../../../types/events";
import chatFooterText from "./chatFooterText";

export default function ChatFooter() {
  const [inputStr, setInputStr] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { addEvent, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<ChatSessionData>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [isGroupMemberRemoved, setIsGroupMemberRemoved] = useState(false);
  const [groupMemberRemovedMessage, setGroupMemberRemovedMessage] = useState("");
  const lastProcessedGroupMemberRemovedEventSignatureRef = useRef("");
  const lastProcessedGroupMemberAddedEventSignatureRef = useRef("");
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLElement>(null);
  const [isLandscapeSm, setIsLandscapeSm] = useState(false);

  const openPrivateChatEvent = useEvent("open_private_chat");
  const activeChatContextEvent = useEvent("active_chat_context");
  const openGroupChatEvent = useEvent("open_group_chat");
  const groupMemberRemovedEvent = useEvent("group_member_removed");
  const groupMemberAddedEvent = useEvent("group_member_added");

  const onEmojiClick = (emojiObject: EmojiClickData, _event: MouseEvent) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-height: 500px) and (orientation: landscape)");
    setIsLandscapeSm(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setIsLandscapeSm(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!showPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPickerRef.current?.contains(target) ||
        emojiButtonRef.current?.contains(target)
      ) {
        return;
      }
      setShowPicker(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  const buildRemovedMessage = (groupName?: string) => chatFooterText.removedFromGroup(groupName);

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

    const groupName = chatData.group_data?.name || groupMemberAddedEvent.group_name;

    if (isSameChatById && groupName) {
      lastProcessedGroupMemberAddedEventSignatureRef.current = addedEventSignature;
      setIsGroupMemberRemoved(false);
      setGroupMemberRemovedMessage("");
      selectGroupChatAction(addEvent, groupName);
      if (groupMemberAddedEvent.message) {
        message.success(groupMemberAddedEvent.message);
      }
    }
  }, [groupMemberAddedEvent]);

  const handleSendMessage = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    const currentData = chatData?.chat_id ? chatData : activeChatContextEvent || chatData;

    if (isGroupMemberRemoved && currentData?.group_data) {
      return;
    }

    if (inputStr.trim() === "") {
      return;
    }

    if (currentData?.group_data) {
      sendMessageToGroupAction(addEvent, inputStr, currentData?.group_data?.name);
    } else if (currentData?.to_user_data) {
      sendMessageToUserAction(addEvent, inputStr, currentData.to_user_data.nickname);
    }

    setInputStr("");
  };

  const footerPadding = isGroupMemberRemoved && chatData.group_data ? "px-0 py-0" : "px-3 py-2 sm:px-4 sm:py-3";
  return (
    <footer className={`shrink-0 flex min-h-16 justify-between ${isGroupMemberRemoved && chatData.group_data ? '' : 'bg-gray-300'} ${footerPadding}`}>
      {isGroupMemberRemoved && chatData.group_data ? (
        <div className="flex h-full w-full items-center justify-center bg-yellow-300 text-yellow-900 text-2xl font-bold tracking-wide" style={{ padding: 0, borderRadius: 0 }}>
          <span className="mx-3" role="img" aria-label={chatFooterText.warningIconLabel}>⚠️</span>
          {groupMemberRemovedMessage}
        </div>
      ) : (
        <form className="flex w-full gap-3" onSubmit={handleSendMessage}>
          <div className="flex items-center w-full justify-center rounded-full bg-gray-100 shadow-sm transition-shadow duration-200 focus-within:shadow-md">
            <input
              className="input bg-transparent border-none h-9 w-full px-4 focus:outline-none shadow-none"
              type="text"
              value={inputStr}
              onChange={(e) => {
                if (e.target.value.length <= 5000) {
                  setInputStr(e.target.value);
                } else {
                  setModalVisible(true);
                }
              }}
              placeholder={chatFooterText.inputPlaceholder}
              maxLength={5001}
            />
            <div className="flex items-center shrink-0">
              <div className="relative">
                <Button
                  ref={emojiButtonRef}
                  className="bg-transparent border-none h-9 w-9 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => setShowPicker((prev) => !prev)}
                  icon={<SmileOutlined />}
                  title={chatFooterText.emojiButton}
                  aria-label={chatFooterText.emojiButton}
                />
                {showPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 z-50 rounded-lg shadow-lg overflow-hidden"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={isLandscapeSm ? 260 : 300}
                      height={isLandscapeSm ? 220 : 360}
                      autoFocusSearch={false}
                      searchDisabled={isLandscapeSm}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              <Button
                className="bg-sky-400 hover:bg-sky-500 border-none text-white h-9 w-9 flex items-center justify-center rounded-full mr-1 transition-colors duration-200"
                icon={<SendOutlined />}
                onClick={(e) => handleSendMessage(e)}
                title={chatFooterText.sendMessageButton}
                aria-label={chatFooterText.sendMessageButton}
              />
            </div>
          </div>
        </form>
      )}
      <Modal
        title={chatFooterText.characterLimitModal.title}
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <p>{chatFooterText.characterLimitModal.message}</p>
      </Modal>
    </footer>
  );
}
