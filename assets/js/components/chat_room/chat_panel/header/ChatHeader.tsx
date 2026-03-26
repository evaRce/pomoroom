import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { UsergroupAddOutlined } from "@ant-design/icons";
import { useEventContext } from "../../EventContext";
import AddMembersModal from "./AddMembersModal";
import CallPanel from "../../call_panel/CallPanel";

interface ChatHeaderProps {
  userLogin: any;
  isVisibleDetail: boolean;
}

export default function ChatHeader({ userLogin, isVisibleDetail }: ChatHeaderProps) {
  const { addEvent, getEventData } = useEventContext() as any;
  const [chatData, setChatData] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [checkAdmin, setCheckAdmin] = useState<any>({});
  const [chatName, setChatName] = useState("");
  const [chatImage, setChatImage] = useState("");

  useEffect(() => {
    const privateChat = getEventData("open_private_chat");

    if (privateChat) {
      setIsGroup(false);
      setChatData(privateChat);
    }
  }, [getEventData("open_private_chat")]);

  useEffect(() => {
    const groupChat = getEventData("open_group_chat");
    if (groupChat) {
      setIsGroup(true);
      setChatData(groupChat);
    }
  }, [getEventData("open_group_chat")]);

  useEffect(() => {
    const adminData = getEventData("check_admin");

    if (adminData) {
      setCheckAdmin(adminData);
    }
  }, [getEventData("check_admin")]);

  useEffect(() => {
    if (chatData) {
      setChatName(setNameChat());
      setChatImage(setImageProfile());
    }
  }, [chatData]);

  const showUserDetails = () => {
    addEvent("toggle_detail_visibility", {
      is_visible: !isVisibleDetail,
      is_group: isGroup,
      group_name: chatName,
    });
    addEvent("show_detail", {
      chat_name: chatName,
      image: chatImage,
      is_group: isGroup,
    });
  };

  const setImageProfile = () => {
    if (chatData.group_data) {
      return chatData.group_data.image;
    } else {
      if (userLogin.nickname === chatData.from_user_data.nickname) {
        return chatData.to_user_data.image_profile;
      } else if (userLogin.nickname === chatData.to_user_data.nickname) {
        return chatData.from_user_data.image_profile;
      }
    }
  };

  const setNameChat = () => {
    if (chatData.group_data) {
      return chatData.group_data.name;
    } else {
      if (userLogin.nickname === chatData.from_user_data.nickname) {
        return chatData.to_user_data.nickname;
      } else if (userLogin.nickname === chatData.to_user_data.nickname) {
        return chatData.from_user_data.nickname;
      }
    }
  };

  const openAddMembersModal = () => {
    addEvent("get_my_contacts", { group_name: chatData.group_data.name });
    setIsModalVisible(true);
  };

  const handleModalVisible = (isModalVisible: boolean) => {
    setIsModalVisible(isModalVisible);
  };

  return (
    <header className="flex h-[10vh] justify-between items-center py-7 px-3 bg-gray-100 ">
      {chatData && (
        <div className="flex items-center space-x-3">
          <img
            className="h-10 w-10 rounded-full bg-white cursor-pointer"
            src={chatImage}
            alt="default"
            onClick={showUserDetails}
            style={{ cursor: "pointer" }}
          />
          <span className="text-grey-darkest ml-3">{chatName}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {chatData?.group_data && checkAdmin.is_admin && (
          <Button
            className="bg-white"
            icon={<UsergroupAddOutlined />}
            onClick={openAddMembersModal}
            title="Añadir miembros"
          />
        )}
        {!chatData?.group_data && (
          <CallPanel chatName={chatName} userLogin={userLogin} />
        )}
        <Button
          className="bg-white"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
          }
          onClick={showUserDetails}
          title="Detalles del contacto"
        />
      </div>
      {chatData?.group_data && (
        <AddMembersModal
          chatData={chatData}
          isModalVisibleFromAddContacts={handleModalVisible}
          isModalVisibleFromHeader={isModalVisible}
        />
      )}
    </header>
  );
}
