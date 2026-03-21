import React, { useState } from "react";
import { Button, Dropdown } from "antd";
import {
  DownOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function GroupMemberItem({
  contact,
  onSelect,
  onSetAdmin,
  onDelete,
  isInModal = false,
  imAdmin,
}) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleMenuClick = (key) => {
    if (key === "addAdmin") {
      onSetAdmin(contact.nickname, "add");
    } else if (key === "deleteAdmin") {
      onSetAdmin(contact.nickname, "delete");
    } else if (key === "deleteMember") {
      onDelete(contact.nickname);
    }
    setDropdownVisible(false);
  };

  const items = [
    {
      label: contact.is_admin ? "Eliminar como admin" : "Establecer como admin",
      key: contact.is_admin ? "deleteAdmin" : "addAdmin",
      icon: <ThunderboltOutlined />,
    },
    {
      label: "Eliminar miembro",
      key: "deleteMember",
      icon: <DeleteOutlined />,
    },
  ];

  const menuProps = {
    items,
    onClick: (e) => handleMenuClick(e.key),
  };

  return (
    <div className="relative flex items-center justify-between p-2 border-b hover:bg-gray-400">
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full bg-white"
            src={contact.image_profile}
            alt={contact.nickname}
          />
        </div>
        <span>{contact.nickname}</span>
      </div>
      <div className="flex items-center space-x-2">
        {contact.is_admin && (
          <span className="text-white font-bold text-xs rounded-full px-2 py-1 bg-gray-500">
            Admin
          </span>
        )}
        {imAdmin && (
          <Dropdown
            menu={menuProps}
            trigger={["click"]}
            open={dropdownVisible}
            onOpenChange={(visible) => setDropdownVisible(visible)}
          >
            <Button
              icon={<DownOutlined />}
              onClick={() => setDropdownVisible(!dropdownVisible)}
            />
          </Dropdown>
        )}
        {isInModal && (
          <Button className="bg-lime-400" onClick={onSelect}>
            Invitar
          </Button>
        )}
      </div>
    </div>
  );
}