import React, { useEffect } from "react";
import { useEventContext } from "../../EventContext";

export default function Contact({ contact, isSelected, onSelect }) {
  const { addEvent, getEventData, removeEvent } = useEventContext();

  const handleChat = () => {
    if (!isSelected) {
      addEvent("selected_chat", { contact_name: contact.name, contact_status: contact.status_request });
      onSelect();
    }
  };

  const getBackgroundContact = () => {
    if (!isSelected) {
      if (contact.status_request === "pending") {
        return 'bg-pink-100';
      } else if (contact.status_request === "rejected") {
        return 'bg-red-300';
      } else {
        return '';
      }
    } else {
      return 'bg-gray-300';
    }
  };

  const getStatusBadgeClass = () => {
    if (contact.status_request === "pending") {
      return "bg-yellow-400";
    } else if (contact.status_request === "rejected") {
      return "bg-red-400";
    } else {
      return "";
    }
  };

  return (
    <div
      className={`relative rounded-lg p-2 flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 mb-1 hover:bg-gray-200 ${getBackgroundContact()}`}
      onClick={handleChat}
    >
      <div className="flex-shrink-0">
        <img
          className="h-10 w-10 rounded-full"
          src={contact.image} />
      </div>
      <div className="flex-1 min-w-20">
        <a className="focus:outline-none" onClick={handleChat}>
          <div className="flex items-center justify-between">
            <span className="text-sm pb-0 overflow-ellipsis overflow-hidden whitespace-nowrap truncate"
              title={contact.name}>
              {contact.name}
            </span>
            {(contact.status_request === "pending" || contact.status_request === "rejected") && (
              <span className={`text-white font-bold text-xs rounded-full px-1 py-0 ${getStatusBadgeClass()}`}>
                {contact.status_request}
              </span>
            )}
          </div>
        </a>
      </div>
    </div>
  )
}