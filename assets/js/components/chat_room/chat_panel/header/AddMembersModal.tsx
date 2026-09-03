import React, { useEffect, useState } from "react";
import { Button, Modal, List, message } from "antd";
import { CopyOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useEventContext, useEvent } from "../../EventContext";
import GroupMemberItem from "../../info_panel/GroupMemberItem";
import { addMemberToGroupAction } from "../../../../services/groupService";
import { ChatSessionData, ConversationEntry } from "../../../../types/events";
import useAddMembersModalText from "./addMembersModalText";

interface AddMembersModalProps {
  chatData: ChatSessionData;
  isModalVisibleFromAddContacts: (isVisible: boolean) => void;
  isModalVisibleFromHeader: boolean;
}

export default function AddMembersModal({
  chatData,
  isModalVisibleFromAddContacts,
  isModalVisibleFromHeader,
}: AddMembersModalProps) {
  const addMembersModalText = useAddMembersModalText();
  const { addEvent, removeEvent } = useEventContext();
  const [contacts, setContacts] = useState<ConversationEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<ConversationEntry[]>([]);
  const showMyContactsEvent = useEvent("show_my_contacts");

  useEffect(() => {
    if (showMyContactsEvent) {
      setContacts(showMyContactsEvent);
      removeEvent("show_my_contacts");
    }
  }, [showMyContactsEvent]);

  useEffect(() => {
    const results = contacts.filter((contact) =>
      contact.contact_data?.nickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const handleModalClose = () => {
    isModalVisibleFromAddContacts(false);
    setSearchTerm("");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const inviteToGroup = (contactData: ConversationEntry["contact_data"]) => {
    if (!chatData.group_data || !contactData) return;
    addMemberToGroupAction(addEvent, chatData.group_data.name, contactData.nickname);
  };

  return (
    <Modal
      title={addMembersModalText.title(chatData?.group_data?.name)}
      open={isModalVisibleFromHeader}
      onCancel={handleModalClose}
      footer={null}
    >
      <div className="flex items-center w-full mb-4">
        <div className="flex items-center w-full rounded-full bg-gray-200 shadow-sm transition-shadow duration-200 focus-within:shadow-md">
          <input
            className="input bg-transparent border-none h-9 w-full min-w-0 px-4 focus:outline-none shadow-none"
            type="text"
            placeholder={addMembersModalText.searchPlaceholder}
            aria-label={addMembersModalText.searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm ? (
            <Button
              className="bg-transparent border-none h-8 w-12 flex items-center justify-center rounded-full mr-1 shrink-0 hover:bg-gray-300 transition-colors duration-200"
              icon={<CloseOutlined />}
              onClick={clearSearch}
              title={addMembersModalText.clearSearch}
              aria-label={addMembersModalText.clearSearch}
            />
          ) : (
            <Button
              className="bg-sky-400 hover:bg-sky-500 border-none text-white h-8 w-12 flex items-center justify-center rounded-full mr-1 shrink-0 transition-colors duration-200"
              icon={<SearchOutlined />}
              title={addMembersModalText.search}
              aria-label={addMembersModalText.search}
            />
          )}
        </div>
      </div>

      <div
        className="h-[26vh] overflow-y-auto bg-gray-100"
        style={{ scrollbarWidth: "thin" }}
      >
        <List
          bordered
          dataSource={filteredContacts}
          renderItem={(item) => (
            !item.contact_data ? null : (
              <li key={item.contact_data.nickname} className="list-none">
                <GroupMemberItem
                  contact={item.contact_data}
                  onSelect={() => inviteToGroup(item.contact_data)}
                  isInModal={true}
                  onSetAdmin={null}
                  onDelete={null}
                  imAdmin={false}
                />
              </li>
            )
          )}
        />
      </div>

      <p className="ml-2 mt-4">
        {addMembersModalText.shareLink}
      </p>

      <div className="flex items-center justify-between gap-2 mt-2 rounded-full bg-gray-200 shadow-sm p-1 pl-4">
        <span className="overflow-ellipsis overflow-hidden whitespace-nowrap truncate text-sm text-gray-600">
          {chatData?.group_data?.invite_link}
        </span>
        <Button
          className="bg-sky-400 hover:bg-sky-500 border-none text-white rounded-full shrink-0 shadow-sm transition-colors duration-200"
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(`${chatData?.group_data?.invite_link}`);
            message.success(addMembersModalText.linkCopied);
          }}
        >
          {addMembersModalText.copyLink}
        </Button>
      </div>
    </Modal>
  );
}
