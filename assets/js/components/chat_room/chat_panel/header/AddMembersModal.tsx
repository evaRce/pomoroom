import React, { useEffect, useState } from "react";
import { Button, Modal, Input, List } from "antd";
import { CopyOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useEventContext, useEvent } from "../../EventContext";
import GroupMemberItem from "../../info_panel/GroupMemberItem";
import { addMemberToGroupAction } from "../../../../services/groupService";
import { ChatSessionData, ConversationEntry } from "../../../../types/events";

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
      title={`Añade a tus panas a ${chatData?.group_data?.name}`}
      open={isModalVisibleFromHeader}
      onCancel={handleModalClose}
      footer={null}
    >
      <div className="flex items-center mb-4">
        <Input
          className="mr-1"
          type="text"
          placeholder="Buscar a mis panas"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm ? (
          <Button
            className="bg-red-300"
            icon={<CloseOutlined />}
            onClick={clearSearch}
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          />
        ) : (
          <Button
            className="bg-sky-400"
            icon={<SearchOutlined />}
            title="Buscar"
            aria-label="Buscar"
          />
        )}
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
              <GroupMemberItem
                contact={item.contact_data}
                onSelect={() => inviteToGroup(item.contact_data)}
                isInModal={true}
                onSetAdmin={null}
                onDelete={null}
                imAdmin={false}
              />
            )
          )}
        />
      </div>

      <p className="ml-2 mt-4">
        O comparte este enlace para invitar a algún pana
      </p>

      <div className="flex items-center justify-between mt-2 p-1 bg-gray-300">
        <span className="mx-2 overflow-ellipsis overflow-hidden whitespace-nowrap truncate">
          {chatData?.group_data?.invite_link}
        </span>
        <Button
          className="bg-sky-400"
          icon={<CopyOutlined />}
          onClick={() =>
            navigator.clipboard.writeText(`${chatData?.group_data?.invite_link}`)
          }
        >
          Copiar enlace
        </Button>
      </div>
    </Modal>
  );
}
