import React, { useState } from "react";
import { Button, Dropdown, type MenuProps } from "antd";
import {
  DownOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ChatMember } from "../../../types/events";
import useInfoPanelText from "./infoPanelText";
import { ConfirmDialog } from "../../../../components-shadcn/ui/confirm-dialog";

interface GroupMemberItemProps {
  contact: ChatMember;
  onSelect: () => void;
  onSetAdmin: ((memberName: string, operation: string) => void) | null;
  onDelete: ((memberName: string) => void) | null;
  isInModal?: boolean;
  imAdmin: boolean;
  isCurrentUser?: boolean;
}

export default function GroupMemberItem({
  contact,
  onSelect,
  onSetAdmin,
  onDelete,
  isInModal = false,
  imAdmin,
  isCurrentUser = false,
}: GroupMemberItemProps) {
  const infoPanelText = useInfoPanelText();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);

  const handleMenuClick = (key: string) => {
    if (key === "addAdmin") {
      onSetAdmin?.(contact.nickname, "add");
    } else if (key === "deleteAdmin") {
      onSetAdmin?.(contact.nickname, "delete");
    } else if (key === "deleteMember") {
      setShowRemoveMemberDialog(true);
    }
    setDropdownVisible(false);
  };

  const items = [
    {
      label: contact.is_admin ? infoPanelText.removeAsAdmin : infoPanelText.setAsAdmin,
      key: contact.is_admin ? "deleteAdmin" : "addAdmin",
      icon: <ThunderboltOutlined />,
    },
    {
      label: infoPanelText.removeMember,
      key: "deleteMember",
      icon: <DeleteOutlined />,
    },
  ];

  const menuProps: MenuProps = {
    items,
    onClick: (e) => handleMenuClick(e.key),
  };

  return (
    <>
    <div className="relative flex items-center justify-between p-2 border-b hover:bg-gray-400 landscape-sm:p-1">
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full bg-white landscape-sm:h-7 landscape-sm:w-7"
            src={contact.image_profile}
            alt=""
          />
        </div>
        <span className="landscape-sm:text-sm">{contact.nickname}</span>
      </div>
      <div className="flex items-center space-x-2">
        {contact.is_admin && (
          <span className="text-white font-bold text-xs rounded-full px-2 py-1 bg-gray-500 landscape-sm:px-1.5 landscape-sm:py-0.5">
            {infoPanelText.adminBadge}
          </span>
        )}
        {imAdmin && !isCurrentUser && (
          <Dropdown
            menu={menuProps}
            trigger={["click"]}
            open={dropdownVisible}
            onOpenChange={(visible) => setDropdownVisible(visible)}
          >
            <Button
              icon={<DownOutlined />}
              onClick={() => setDropdownVisible(!dropdownVisible)}
              title={infoPanelText.moreOptions}
              aria-label={infoPanelText.moreOptions}
            />
          </Dropdown>
        )}
        {isInModal && (
          <Button className="bg-lime-400" onClick={onSelect}>
            {infoPanelText.invite}
          </Button>
        )}
      </div>
    </div>

    <ConfirmDialog
      open={showRemoveMemberDialog}
      variant="danger"
      title={infoPanelText.confirmRemoveMemberTitle}
      content={infoPanelText.confirmRemoveMemberMessage(contact.nickname)}
      confirmLabel={infoPanelText.removeMember}
      cancelLabel={infoPanelText.confirmCancelButton}
      onClose={() => setShowRemoveMemberDialog(false)}
      onConfirm={() => {
        setShowRemoveMemberDialog(false);
        onDelete?.(contact.nickname);
      }}
    />
    </>
  );
}