import React, { useState, useEffect } from "react";
import { Avatar, Button, List } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useEventContext } from "../EventContext";
import GroupMemberItem from "./GroupMemberItem";

export default function ChatDetailPanel() {
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState(null);
  const [members, setMembers] = useState([]);
  const [checkAdmin, setCheckAdmin] = useState({});

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
    const adminData = getEventData("check_admin");

    if (adminData) {
      setCheckAdmin(adminData.is_admin);
    }
  }, [getEventData("check_admin")]);

  const hideUserDetails = () => {
    addEvent("toggle_detail_visibility", {
      is_visible: false,
      is_group: chatData?.is_group || false,
      group_name: chatData?.chat_name,
    });
    removeEvent("check_admin");
    removeEvent("show_detail");
    removeEvent("show_members");
  };

  const setAdmin = (memberName, operation) => {
    addEvent("set_admin", {
      member_name: memberName,
      group_name: chatData.chat_name,
      operation: operation,
    });
  };

  const deleteMember = (memberName) => {
    const index = members.findIndex(
      (memberFind) => memberFind.nickname === memberName
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
