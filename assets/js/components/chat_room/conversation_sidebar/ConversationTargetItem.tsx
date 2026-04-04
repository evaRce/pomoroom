import React, { useState } from "react";
import { Button, Dropdown } from "antd";
import { useEventContext } from "../EventContext";
import { DownOutlined, DeleteOutlined } from "@ant-design/icons";

export default function ConversationTargetItem({ contact, isSelected, onSelect, onDelete }: any) {
  const { addEvent } = useEventContext();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleChat = () => {
    if (!isSelected) {
      if (contact.is_group) {
        addEvent("selected_group_chat", { group_name: contact.name });
      } else {
        addEvent("selected_private_chat", { contact_name: contact.name });
      }
      onSelect();
    }
  };

  const getBackgroundContact = () => {
    if (isSelected) {
      return 'bg-gray-300';
    }
    switch (contact.status_request) {
      case "pending":
        return 'bg-yellow-100';
      case "rejected":
        return 'bg-red-300';
      default:
        return '';
    }
  };

  const getBackgroundStatus = () => {
    switch (contact.status_request) {
      case "pending":
        return "bg-yellow-400";
      case "rejected":
        return "bg-red-400";
      default:
        return "";
    }
  };

  const handleMenuClick = (e: any, key: any) => {
    e.domEvent.stopPropagation(); // Prevent container selection
    if (key === "deleteChat") {
      onDelete(contact.nickname);
    }
    setDropdownVisible(false);
  };

  const items = [
    {
      label: contact.is_group
        ? (contact.is_group_member_removed || contact.is_group_admin)
          ? "Eliminar grupo"
          : "Dejar grupo"
        : "Eliminar conversación",
      key: "deleteChat",
      icon: <DeleteOutlined />,
    },
  ];

  const menuProps = {
    items,
    onClick: (e: any) => handleMenuClick(e, e.key),
  };

  const handleDropdownVisibility = (visible: any) => {
    setDropdownVisible(visible);
  };

  const handleButtonClick = (e: any) => {
    e.stopPropagation(); // Prevent click from propagating to the contact container
    setDropdownVisible(!dropdownVisible); // Toggle dropdown visibility
  };

  return (
    <div
      className={`relative rounded-lg p-2 flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 mb-1 hover:bg-gray-400 ${getBackgroundContact()}`}
      onClick={handleChat}
    >
      <div className="flex-shrink-0 rounded-full">
        <img
          className="h-10 w-10 rounded-full bg-white"
          src={contact.image}
          alt={contact.name}
        />
      </div>
      <div className="flex-1 min-w-20">
        <a className="focus:outline-none" onClick={handleChat}>
          <div className="flex items-center justify-between">
            <span className="text-sm pb-0 overflow-ellipsis overflow-hidden whitespace-nowrap truncate"
              title={contact.name}>
              {contact.name}
            </span>
            {(contact.status_request === "pending" || contact.status_request === "rejected") && (
              <span className={`text-white font-bold text-xs rounded-full px-2 py-1 ${getBackgroundStatus()}`}>
                {contact.status_request}
              </span>
            )}
            {contact.status_request === "accepted" && (
              <Dropdown
                menu={menuProps}
                trigger={["click"]}
                open={dropdownVisible}
                onOpenChange={handleDropdownVisibility}
              >
                <Button
                  className="hover:bg-gray-700"
                  icon={<DownOutlined />}
                  onClick={handleButtonClick}
                />
              </Dropdown>
            )}
          </div>
        </a>
      </div>
    </div>
  );
}
