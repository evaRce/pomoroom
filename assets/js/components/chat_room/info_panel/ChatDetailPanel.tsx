import React, { useState, useEffect } from "react";
import { Avatar, Button, List } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useEventContext, useEvent } from "../EventContext";
import GroupMemberItem from "./GroupMemberItem";
import { toggleDetailVisibilityAction } from "../../../services/contactService";
import {
  setGroupAdminAction,
  deleteMemberAction,
} from "../../../services/groupService";
import type { ChatMember, EventBusPayload } from "../../../types/events";
import infoPanelText from "./infoPanelText";

export default function ChatDetailPanel() {
  const { addEvent, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<EventBusPayload<"show_detail"> | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [checkAdmin, setCheckAdmin] = useState(false);
  const [currentUserNickname, setCurrentUserNickname] = useState("");
  const currentChatId = chatData?.chat_id || "";
  const currentGroupName = chatData?.group_name || chatData?.chat_name || "";

  const showDetailEvent = useEvent("show_detail");
  const showMembersEvent = useEvent("show_members");
  const groupAdminUpdatedEvent = useEvent("group_admin_updated");
  const showUserInfoEvent = useEvent("show_user_info");
  const groupMemberRemovedEvent = useEvent("group_member_removed");

  useEffect(() => {
    if (showDetailEvent) {
      setChatData(showDetailEvent);
    }
  }, [showDetailEvent]);

  useEffect(() => {
    if (showMembersEvent) {
      setMembers(showMembersEvent.members || []);
      removeEvent("show_members");
    }
  }, [showMembersEvent]);

  useEffect(() => {
    const isAdminUpdateForCurrentChat =
      groupAdminUpdatedEvent &&
      ((currentChatId && groupAdminUpdatedEvent.chat_id && currentChatId === groupAdminUpdatedEvent.chat_id) ||
        (currentGroupName &&
          groupAdminUpdatedEvent.group_name &&
          currentGroupName === groupAdminUpdatedEvent.group_name));

    if (groupAdminUpdatedEvent && isAdminUpdateForCurrentChat) {
      setCheckAdmin(Boolean(groupAdminUpdatedEvent.is_admin));
    }
  }, [groupAdminUpdatedEvent, currentChatId, currentGroupName]);

  useEffect(() => {
    if (showUserInfoEvent?.nickname) {
      setCurrentUserNickname(showUserInfoEvent.nickname);
    }
  }, [showUserInfoEvent]);

  useEffect(() => {
    if (!currentUserNickname || !Array.isArray(members) || members.length === 0) {
      return;
    }

    const currentMember = members.find(
      (member) => member?.nickname === currentUserNickname
    );

    if (currentMember) {
      const nextIsAdmin = Boolean(currentMember.is_admin);
      setCheckAdmin(nextIsAdmin);
    }
  }, [members, currentUserNickname]);

  useEffect(() => {
    const isRemovedEventForCurrentChat =
      groupMemberRemovedEvent &&
      ((currentChatId && groupMemberRemovedEvent.chat_id && currentChatId === groupMemberRemovedEvent.chat_id) ||
        (currentGroupName &&
          groupMemberRemovedEvent.group_name &&
          currentGroupName === groupMemberRemovedEvent.group_name));

    if (groupMemberRemovedEvent && isRemovedEventForCurrentChat) {
      hideUserDetails();
    }
  }, [groupMemberRemovedEvent, currentChatId, currentGroupName]);

  const hideUserDetails = () => {
    toggleDetailVisibilityAction(
      addEvent,
      false,
      Boolean(chatData?.is_group),
      chatData?.group_name || chatData?.chat_name || ""
    );
    removeEvent("check_admin");
    removeEvent("show_detail");
  };

  const setAdmin = (memberName: string, operation: string) => {
    if (!chatData) return;
    setGroupAdminAction(addEvent, memberName, chatData.chat_name, operation);
  };

  const deleteMember = (memberName: string) => {
    if (!chatData) return;
    const index = members.findIndex(
      (memberFind) => memberFind.nickname === memberName
    );
    if (index !== -1) {
      deleteMemberAction(addEvent, memberName, chatData.chat_name);
      setMembers((prevMembers) => {
        const newMembers = [...prevMembers];
        newMembers.splice(index, 1);
        return newMembers;
      });
    }
  };

  return (
    <div
      className="overflow-y-auto shrink-0 w-full h-dvh sm:h-auto sm:w-72 sm:max-w-[28vw] lg:w-80 xl:w-96 bg-gray-100 p-3"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="min-w-0">
        <Button
          className="top-0 left-0 bg-white"
          icon={<CloseOutlined />}
          onClick={hideUserDetails}
          title={infoPanelText.closeDetails}
          aria-label={infoPanelText.closeDetails}
        />
        {chatData && (
          <div className="text-center w-full mb-10">
            <Avatar
              src={chatData.image}
              size={150}
              alt={infoPanelText.defaultAvatarAlt}
              className="bg-white"
            />
            <h2 className="text-2xl mt-2">{chatData.chat_name}</h2>
          </div>
        )}
        {chatData?.is_group && (
          <div className="my-4">
            <span>{infoPanelText.members(members.length)}</span>
          </div>
        )}
        {chatData?.is_group && (
          <div
            className="h-[40vh] w-full overflow-y-auto relative"
            style={{ scrollbarWidth: "thin" }}
          >
            <List
              bordered
              dataSource={members}
              renderItem={(item, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <GroupMemberItem
                    contact={item}
                    onSelect={() => console.log("Miembro ", item.nickname)}
                    onSetAdmin={setAdmin}
                    onDelete={deleteMember}
                    imAdmin={checkAdmin}
                    isCurrentUser={item.nickname === currentUserNickname}
                  />
                </div>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
