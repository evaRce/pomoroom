import React, { useState, useEffect } from "react";
import { Avatar, Button, List } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useEventContext, useEvent } from "../EventContext";
import GroupMemberItem from "./GroupMemberItem";
import { toggleDetailVisibilityAction } from "../../../services/contactService";
import {
  setGroupAdminAction,
  deleteMemberAction,
  deleteGroupForEveryoneAction,
} from "../../../services/groupService";
import type { ChatMember, EventBusPayload } from "../../../types/events";
import useInfoPanelText from "./infoPanelText";
import { ConfirmDialog } from "../../../../components-shadcn/ui/confirm-dialog";

export default function ChatDetailPanel() {
  const infoPanelText = useInfoPanelText();
  const { addEvent, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState<EventBusPayload<"show_detail"> | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [checkAdmin, setCheckAdmin] = useState(false);
  const [currentUserNickname, setCurrentUserNickname] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
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

  const deleteGroupForEveryone = () => {
    if (!chatData) return;
    deleteGroupForEveryoneAction(addEvent, chatData.chat_name);
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
    <div className="flex flex-col shrink-0 w-full h-dvh overflow-hidden sm:w-72 sm:max-w-[28vw] lg:w-80 xl:w-96 bg-gray-100 p-3 landscape-sm:p-2">
      <div className="flex flex-1 min-h-0 min-w-0 flex-col">
        <Button
          className="shrink-0 top-0 left-0 bg-white landscape-sm:!h-7 landscape-sm:!w-7"
          icon={<CloseOutlined />}
          onClick={hideUserDetails}
          title={infoPanelText.closeDetails}
          aria-label={infoPanelText.closeDetails}
        />
        {chatData && (
          <div className="shrink-0 text-center w-full mb-4 landscape-sm:mb-1">
            <Avatar
              src={chatData.image}
              size={96}
              alt={infoPanelText.defaultAvatarAlt}
              className="bg-white landscape-sm:!h-12 landscape-sm:!w-12"
            />
            <h2 className="text-xl mt-2 landscape-sm:text-sm landscape-sm:mt-1">{chatData.chat_name}</h2>
          </div>
        )}
        {chatData?.is_group && (
          <div className="shrink-0 my-2 landscape-sm:my-0.5 landscape-sm:text-xs">
            <span>{infoPanelText.members(members.length)}</span>
          </div>
        )}
        {chatData?.is_group && (
          <div
            className="flex-1 min-h-0 w-full overflow-y-auto relative"
            style={{ scrollbarWidth: "thin" }}
          >
            <List
              bordered
              dataSource={members}
              renderItem={(item, index) => (
                <li key={index} className="list-none" style={{ position: "relative" }}>
                  <GroupMemberItem
                    contact={item}
                    onSelect={() => console.log("Miembro ", item.nickname)}
                    onSetAdmin={setAdmin}
                    onDelete={deleteMember}
                    imAdmin={checkAdmin}
                    isCurrentUser={item.nickname === currentUserNickname}
                  />
                </li>
              )}
            />
          </div>
        )}
        {chatData?.is_group && (
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className="shrink-0 mt-2 w-full py-2 landscape-sm:mt-1 landscape-sm:py-1 rounded-md border border-gray-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50"
          >
            {infoPanelText.leaveGroup}
          </button>
        )}
        {chatData?.is_group && checkAdmin && (
          <button
            type="button"
            onClick={() => setShowDeleteGroupDialog(true)}
            className="shrink-0 mt-2 w-full py-2 landscape-sm:mt-1 landscape-sm:py-1 rounded-md border border-gray-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50"
          >
            {infoPanelText.deleteGroup}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showLeaveDialog}
        variant="danger"
        title={infoPanelText.confirmLeaveGroupTitle}
        content={infoPanelText.confirmLeaveGroupMessage(currentGroupName)}
        confirmLabel={infoPanelText.leaveGroup}
        cancelLabel={infoPanelText.confirmCancelButton}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={() => {
          setShowLeaveDialog(false);
          deleteMember(currentUserNickname);
        }}
      />

      <ConfirmDialog
        open={showDeleteGroupDialog}
        variant="danger"
        title={infoPanelText.confirmDeleteGroupTitle}
        content={infoPanelText.confirmDeleteGroupMessage(currentGroupName)}
        confirmLabel={infoPanelText.deleteGroup}
        cancelLabel={infoPanelText.confirmCancelButton}
        onClose={() => setShowDeleteGroupDialog(false)}
        onConfirm={() => {
          setShowDeleteGroupDialog(false);
          deleteGroupForEveryone();
        }}
      />
    </div>
  );
}
