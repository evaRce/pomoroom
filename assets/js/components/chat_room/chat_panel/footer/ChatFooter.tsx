import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, message } from "antd";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  SendOutlined,
  SmileOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEventContext, useEvent } from "../../EventContext";
import { sendMessageToGroupAction, sendMessageToUserAction } from "../../../../services/messageService";
import { selectGroupChatAction } from "../../../../services/groupService";
import type { ChatSessionData } from "../../../../types/events";
import useChatFooterText from "./chatFooterText";

export default function ChatFooter() {
  const chatFooterText = useChatFooterText();
  const [inputStr, setInputStr] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { addEvent, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<ChatSessionData>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [isGroupMemberRemoved, setIsGroupMemberRemoved] = useState(false);
  const [groupMemberRemovedMessage, setGroupMemberRemovedMessage] = useState("");
  const [isGroupDeleted, setIsGroupDeleted] = useState(false);
  const [groupDeletedMessage, setGroupDeletedMessage] = useState("");
  const lastProcessedGroupMemberRemovedEventSignatureRef = useRef("");
  const lastProcessedGroupMemberAddedEventSignatureRef = useRef("");
  const lastProcessedGroupDeletedEventSignatureRef = useRef("");
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLandscapeSm, setIsLandscapeSm] = useState(false);
  const MAX_INPUT_LINES = 3;

  const openPrivateChatEvent = useEvent("open_private_chat");
  const activeChatContextEvent = useEvent("active_chat_context");
  const openGroupChatEvent = useEvent("open_group_chat");
  const groupMemberRemovedEvent = useEvent("group_member_removed");
  const groupMemberAddedEvent = useEvent("group_member_added");
  const groupDeletedEvent = useEvent("group_deleted");

  const onEmojiClick = (emojiObject: EmojiClickData, _event: MouseEvent) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    const maxHeight = lineHeight * MAX_INPUT_LINES;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [inputStr, isLandscapeSm]);

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
      setIsGroupDeleted(false);
      setGroupDeletedMessage("");
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
      setIsGroupDeleted(false);
      setGroupDeletedMessage("");
    }
  }, [activeChatContextEvent]);

  useEffect(() => {
    if (openGroupChatEvent) {
      setChatData(openGroupChatEvent);
      setIsGroupMemberRemoved(Boolean(openGroupChatEvent.removed_at));
      setGroupMemberRemovedMessage(
        openGroupChatEvent.removed_at ? buildRemovedMessage(openGroupChatEvent.group_data?.name) : ""
      );
      setIsGroupDeleted(false);
      setGroupDeletedMessage("");
      removeEvent("open_group_chat");
    }
  }, [openGroupChatEvent]);

  useEffect(() => {
    if (!groupDeletedEvent) return;

    const deletedEventSignature = `${groupDeletedEvent.chat_id || ""}:${groupDeletedEvent.group_name || ""}`;

    if (lastProcessedGroupDeletedEventSignatureRef.current === deletedEventSignature) return;

    const isSameChatById =
      chatData?.chat_id &&
      groupDeletedEvent.chat_id &&
      chatData.chat_id === groupDeletedEvent.chat_id;

    if (isSameChatById) {
      lastProcessedGroupDeletedEventSignatureRef.current = deletedEventSignature;
      setIsGroupDeleted(true);
      setGroupDeletedMessage(chatFooterText.groupDeleted(groupDeletedEvent.group_name));
    }
  }, [groupDeletedEvent]);

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

  const handleSendMessage = (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    const currentData = chatData?.chat_id ? chatData : activeChatContextEvent || chatData;

    if ((isGroupMemberRemoved || isGroupDeleted) && currentData?.group_data) {
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

  const isRemovedBannerVisible = (isGroupMemberRemoved || isGroupDeleted) && chatData.group_data;
  const bannerMessage = isGroupDeleted ? groupDeletedMessage : groupMemberRemovedMessage;

  return (
    <footer
      className={
        isRemovedBannerVisible
          ? "shrink-0 flex min-h-16 items-center justify-center gap-3 border-t-2 border-amber-400 bg-amber-100 px-4 py-3 landscape-sm:min-h-10 landscape-sm:gap-2 landscape-sm:px-3 landscape-sm:py-1"
          : "shrink-0 flex min-h-16 items-center justify-between px-3 py-2 sm:px-4 sm:py-3 landscape-sm:min-h-10 landscape-sm:px-2 landscape-sm:py-1"
      }
    >
      {isRemovedBannerVisible ? (
        <>
          <WarningOutlined
            role="img"
            aria-label={chatFooterText.warningIconLabel}
            className="shrink-0 text-xl text-amber-600"
          />
          <span className="text-base sm:text-lg font-semibold text-amber-900 text-center">
            {bannerMessage}
          </span>
        </>
      ) : (
        <form className="flex w-full gap-3" onSubmit={handleSendMessage}>
          <div className="flex items-end w-full justify-center rounded-full bg-gray-200 shadow-sm transition-shadow duration-200 focus-within:shadow-md py-1">
            <textarea
              ref={textareaRef}
              className="input bg-transparent border-none resize-none w-full min-w-0 px-4 py-1.5 leading-5 focus:outline-none shadow-none landscape-sm:leading-4 landscape-sm:px-3"
              rows={1}
              value={inputStr}
              onChange={(e) => {
                if (e.target.value.length <= 5000) {
                  setInputStr(e.target.value);
                } else {
                  setModalVisible(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={chatFooterText.inputPlaceholder}
              aria-label={chatFooterText.inputPlaceholder}
              maxLength={5001}
            />
            <div className="flex items-center shrink-0">
              <div className="relative">
                <Button
                  ref={emojiButtonRef}
                  className="bg-transparent border-none h-8 w-12 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200 landscape-sm:!h-6 landscape-sm:!w-10"
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
                      width={isLandscapeSm ? 240 : 300}
                      height={isLandscapeSm ? 170 : 360}
                      autoFocusSearch={false}
                      searchDisabled={isLandscapeSm}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              <Button
                className="bg-sky-400 hover:bg-sky-500 border-none text-white h-8 w-12 flex items-center justify-center rounded-full mr-1 transition-colors duration-200 landscape-sm:!h-6 landscape-sm:!w-10"
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
