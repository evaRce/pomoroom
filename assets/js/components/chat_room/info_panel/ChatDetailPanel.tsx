import React, { useState, useEffect } from "react";
import { Avatar, Button, List } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useEventContext } from "../EventContext";
import GroupMemberItem from "./GroupMemberItem";

export default function ChatDetailPanel() {
  const { addEvent, getEventData, removeEvent } = useEventContext() as any;
  const [chatData, setChatData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [checkAdmin, setCheckAdmin] = useState<any>({});
  const [currentUserNickname, setCurrentUserNickname] = useState("");
  const currentChatId = chatData?.chat_id || "";
  const currentGroupName = chatData?.group_name || chatData?.chat_name || "";

  useEffect(() => {
    const chat = getEventData("show_detail");

    if (chat) {
      setChatData(chat);
    }
  }, [getEventData("show_detail")]);

  useEffect(() => {
    const membersData = getEventData("show_members");

    if (membersData) {
      setMembers(membersData.members);
      removeEvent("show_members");
    }
  }, [getEventData("show_members")]);

  useEffect(() => {
    const groupAdminUpdatedEvent = getEventData("group_admin_updated");

    const isAdminUpdateForCurrentChat =
      groupAdminUpdatedEvent &&
      ((currentChatId && groupAdminUpdatedEvent.chat_id && currentChatId === groupAdminUpdatedEvent.chat_id) ||
        (currentGroupName &&
          groupAdminUpdatedEvent.group_name &&
          currentGroupName === groupAdminUpdatedEvent.group_name));

    if (groupAdminUpdatedEvent && isAdminUpdateForCurrentChat) {
      setCheckAdmin(Boolean(groupAdminUpdatedEvent.is_admin));  
    }
  }, [getEventData("group_admin_updated"), currentChatId, currentGroupName]);

  useEffect(() => {
    const userInfo = getEventData("show_user_info");

    if (userInfo?.nickname) {
      setCurrentUserNickname(userInfo.nickname);
    }
  }, [getEventData("show_user_info")]);

  useEffect(() => {
    if (!currentUserNickname || !Array.isArray(members) || members.length === 0) {
      return;
    }

    const currentMember = members.find(
      (member: any) => member?.nickname === currentUserNickname
    );

    if (currentMember) {
      const nextIsAdmin = Boolean(currentMember.is_admin);
      setCheckAdmin(nextIsAdmin);
    }
  }, [members, currentUserNickname]);

  useEffect(() => {
    const groupMemberRemovedEvent = getEventData("group_member_removed");
    const isRemovedEventForCurrentChat =
      groupMemberRemovedEvent &&
      ((currentChatId && groupMemberRemovedEvent.chat_id && currentChatId === groupMemberRemovedEvent.chat_id) ||
        (currentGroupName &&
          groupMemberRemovedEvent.group_name &&
          currentGroupName === groupMemberRemovedEvent.group_name));

    if (groupMemberRemovedEvent && isRemovedEventForCurrentChat) {
      hideUserDetails();
    }
  }, [getEventData("group_member_removed"), currentChatId, currentGroupName]);

  const hideUserDetails = () => {
    addEvent("toggle_detail_visibility", {
      is_visible: false,
      is_group: Boolean(chatData?.is_group),
      group_name: chatData?.group_name || chatData?.chat_name,
    });
    removeEvent("check_admin");
    removeEvent("show_detail");
  };

  const setAdmin = (memberName: any, operation: any) => {
    addEvent("set_admin", {
      member_name: memberName,
      group_name: chatData.chat_name,
      operation: operation,
    });
  };

  const deleteMember = (memberName: any) => {
    const index = members.findIndex(
      (memberFind: any) => memberFind.nickname === memberName
    );
    if (index !== -1) {
      addEvent("delete_member", {
        member_name: memberName,
        group_name: chatData.chat_name,
      });
      setMembers((prevMembers) => {
        const newMembers = [...prevMembers];
        newMembers.splice(index, 1);
        return newMembers;
      });
    }
  };

  return (
    <div
      className="overflow-y-auto lg:pr-8 lg:flex-shrink-0 xl:pr-0 xl:block bg-gray-100 p-3"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="min-w-[28vw]">
        <Button
          className="top-0 left-0 bg-white"
          icon={<CloseOutlined />}
          onClick={hideUserDetails}
        />
        {chatData && (
          <div className="text-center w-[27vw] mb-10">
            <Avatar
              src={chatData.image}
              size={150}
              alt="default"
              className="bg-white"
            />
            <h2 className="text-2xl mt-2">{chatData.chat_name}</h2>
          </div>
        )}
        <div className="mb-2">
          <h4>Archivos, documentos, etc</h4>
        </div>
        <div
          className="grid h-[26vh] w-[27vw] overflow-y-auto justify-items-center grid-cols-3 gap-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <div className="cursor-pointer bg-gray-300 hover:bg-gray-400 h-[12vh] w-[8vw]"></div>
            </div>
          ))}
        </div>
        {chatData?.is_group && (
          <div className="my-4">
            <span>{members.length} Miembros</span>
          </div>
        )}
        {chatData?.is_group && (
          <div
            className="h-[40vh] w-[27vw] overflow-y-auto relative"
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
