import React, { useState } from "react";
import { Button, Dropdown } from "antd";
import { Brain, Coffee, RotateCcw } from "lucide-react";
import { useEventContext } from "../EventContext";
import { DownOutlined, DeleteOutlined } from "@ant-design/icons";
import { usePomodoroNotification } from "../pomodoro_timer/pomodoroNotificationStore";
import pomodoroTimerText from "../pomodoro_timer/pomodoroTimerText";

export default function ConversationTargetItem({ contact, isSelected, onSelect, onDelete }: any) {
  const { addEvent } = useEventContext();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const notification = usePomodoroNotification(contact?.chat_id || "");
  const hasPendingNotification = Boolean(notification?.hasPendingNotification);

  const handleChat = () => {
    if (!isSelected) {
      if (contact.is_group) {
        addEvent("selected_group_chat", { group_name: contact.name });
      } else {
        addEvent("selected_private_chat", { contact_name: contact.name });
      }
      onSelect();
    }
    addEvent("mobile_open_chat", true);
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

  const pomodoroEventVisuals = {
    work: {
      icon: <Brain size={14} />,
      label: pomodoroTimerText.workTimerEnded,
      className: "text-sky-600 bg-sky-100 border-sky-400",
    },
    shortBreak: {
      icon: <Coffee size={14} />,
      label: pomodoroTimerText.shortBreakTimerEnded,
      className: "text-green-700 bg-green-100 border-green-400",
    },
    longBreak: {
      icon: <RotateCcw size={14} />,
      label: pomodoroTimerText.longBreakTimerEnded,
      className: "text-yellow-700 bg-yellow-100 border-yellow-400",
    },
  };

  const lastPomodoroEventVisual = notification?.lastMode
    ? pomodoroEventVisuals[notification.lastMode]
    : null;

  return (
    <div
      className={`relative rounded-lg p-3 sm:p-1.5 lg:p-2 flex items-center gap-3 sm:gap-2 lg:gap-3 hover:border-gray-400 focus-within:ring-2 mb-1 hover:bg-gray-400 ${getBackgroundContact()}`}
      onClick={handleChat}
    >
      <div className="flex-shrink-0 rounded-full">
        <img
          className="h-12 w-12 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full bg-white"
          src={contact.image}
          alt={contact.name}
        />
      </div>
      <div className="flex-1 min-w-0">
        <a className="focus:outline-none" onClick={handleChat}>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="flex-1 min-w-0 text-base sm:text-xs lg:text-sm truncate pb-0"
                title={contact.name}
              >
                {contact.name}
              </span>
              {hasPendingNotification && lastPomodoroEventVisual && (
                <span
                  className={`flex shrink-0 items-center gap-1 px-2 py-1 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-1 rounded-full border text-xs sm:text-[10px] lg:text-xs ${lastPomodoroEventVisual.className}`}
                  title={lastPomodoroEventVisual.label}
                >
                  <span className="shrink-0">
                    {lastPomodoroEventVisual.icon}
                  </span>

                  <span className="hidden xl:inline">
                    {lastPomodoroEventVisual.label}
                  </span>
                </span>
              )}
            </div>
            {(contact.status_request === "pending" || contact.status_request === "rejected") && (
              <span className={`text-white font-bold text-xs sm:text-[10px] lg:text-xs rounded-full px-2 py-1 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-1 ${getBackgroundStatus()}`}>
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
                  className="hover:bg-gray-700 ml-1"
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
