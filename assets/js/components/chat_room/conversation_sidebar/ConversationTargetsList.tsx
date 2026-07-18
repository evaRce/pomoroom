import React, { useState, useEffect, Fragment, useRef } from "react";
import { Button, Input } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import ConversationTargetItem from "./ConversationTargetItem";
import { useEventContext, useEvent } from "../EventContext";

const INITIAL_BATCH_SIZE = 15;
const BATCH_SIZE = 10;

export default function ConversationTargetsList() {
  const { addEvent, removeEvent } = useEventContext() as any;
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [userLogin, setUserLogin] = useState<any>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const lastProcessedGroupAdminUpdatedRef = useRef("");

  const addContactToListEvent = useEvent("add_contact_to_list");
  const showListContactEvent = useEvent("show_list_contact");
  const deleteRejectedContactEvent = useEvent("delete_rejected_contact");
  const showUserInfoEvent = useEvent("show_user_info");
  const updateContactStatusAcceptedEvent = useEvent("update_contact_status_to_accepted");
  const updateContactStatusRejectedEvent = useEvent("update_contact_status_to_rejected");
  const deselectContactEvent = useEvent("deselect_contact");
  const addGroupToListEvent = useEvent("add_group_to_list");
  const groupAdminUpdatedEvent = useEvent("group_admin_updated");
  const showListMessagesEvent = useEvent("show_list_messages");

  const getCurrentUserRemovedAtFromGroup = (groupData: any, nickname: string) => {
    if (!groupData || !nickname) {
      return null;
    }

    const members = groupData.members || [];
    const myMember = members.find((member: any) => {
      const memberId = member?.user_id || member?.["user_id"];
      return memberId === nickname;
    });

    return myMember?.removed_at || myMember?.["removed_at"] || null;
  };

  const isCurrentUserGroupAdmin = (groupData: any, nickname: string) => {
    if (!groupData || !nickname) {
      return false;
    }

    const adminList = groupData.admin || [];
    return adminList.includes(nickname);
  };

  useEffect(() => {
    if (addContactToListEvent) {
      addContact(addContactToListEvent);
      removeEvent("add_contact_to_list");
    }
  }, [addContactToListEvent]);

  useEffect(() => {
    if (Array.isArray(showListContactEvent) && showListContactEvent.length > 0) {
      const normalizedList = showListContactEvent.map((contact: any) =>
        normalizeContact(contact)
      );
      setContacts(normalizedList);
      setVisibleCount(INITIAL_BATCH_SIZE);
      removeEvent("show_list_contact");
      return;
    }

    if (showListContactEvent) {
      removeEvent("show_list_contact");
    }
  }, [showListContactEvent]);

  useEffect(() => {
    if (deleteRejectedContactEvent) {
      deleteContact({ name: deleteRejectedContactEvent, is_group: false });
      removeEvent("delete_rejected_contact");
    }
  }, [deleteRejectedContactEvent]);

  useEffect(() => {
    if (showUserInfoEvent) {
      setUserLogin(showUserInfoEvent);
    }
  }, [showUserInfoEvent]);

  useEffect(() => {
    if (updateContactStatusAcceptedEvent) {
      updateContactStatus(
        updateContactStatusAcceptedEvent?.request,
        updateContactStatusAcceptedEvent?.new_status
      );
      removeEvent("update_contact_status_to_accepted");
    }
  }, [updateContactStatusAcceptedEvent]);

  useEffect(() => {
    if (updateContactStatusRejectedEvent) {
      updateContactStatus(
        updateContactStatusRejectedEvent?.request,
        updateContactStatusRejectedEvent?.new_status
      );
      removeEvent("update_contact_status_to_rejected");
    }
  }, [updateContactStatusRejectedEvent]);

  useEffect(() => {
    if (deselectContactEvent) {
      if (
        deselectContactEvent?.from_user === selectedContact ||
        deselectContactEvent?.to_user === selectedContact
      ) {
        setSelectedContact("");
      }
      removeEvent("deselect_contact");
    }
  }, [deselectContactEvent]);

  useEffect(() => {
    if (addGroupToListEvent) {
      addContact(addGroupToListEvent);
      removeEvent("add_group_to_list");
    }
  }, [addGroupToListEvent]);

  useEffect(() => {
    if (!showListMessagesEvent?.chat_id) return;

    const openContact = contacts.find(
      (contact) => contact.chat_id === showListMessagesEvent.chat_id
    );

    if (openContact) {
      setSelectedContact(openContact.name);
    }
  }, [showListMessagesEvent, contacts]);

  useEffect(() => {
    if (!groupAdminUpdatedEvent?.group_name) return;

    const adminUpdateSignature = `${groupAdminUpdatedEvent.chat_id || ""}:${groupAdminUpdatedEvent.group_name || ""}:${groupAdminUpdatedEvent.is_admin || false}`;

    if (lastProcessedGroupAdminUpdatedRef.current === adminUpdateSignature) return;

    lastProcessedGroupAdminUpdatedRef.current = adminUpdateSignature;

    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (!contact?.is_group || contact.name !== groupAdminUpdatedEvent.group_name) {
          return contact;
        }

        return {
          ...contact,
          is_group_admin: Boolean(groupAdminUpdatedEvent.is_admin),
        };
      })
    );
  }, [groupAdminUpdatedEvent]);

  useEffect(() => {
    const results = contacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(results);

    if (searchTerm) {
      setVisibleCount(INITIAL_BATCH_SIZE);
      return;
    }

    setVisibleCount((prev) => Math.min(Math.max(prev, INITIAL_BATCH_SIZE), results.length || INITIAL_BATCH_SIZE));
  }, [searchTerm, contacts]);

  const normalizeContact = (contact: any) => {
    const groupData = contact?.group_data;
    const removedAt = getCurrentUserRemovedAtFromGroup(groupData, userLogin?.nickname);
    const isGroupAdmin = isCurrentUserGroupAdmin(groupData, userLogin?.nickname);

    return {
      name:
        contact?.contact_data?.nickname ||
        groupData?.name,
      chat_id:
        contact?.contact_data?.chat_id ||
        contact?.chat_id ||
        groupData?.chat_id ||
        null,
      image:
        contact?.contact_data?.image_profile ||
        groupData?.image,
      status_request:
        contact?.request?.status ||
        contact?.status,
      is_group: Boolean(contact?.is_group),
      is_group_member_removed: Boolean(removedAt),
      is_group_admin: isGroupAdmin,
      group_data_raw: groupData,
    };
  };

  const addContact = (contact: any) => {
    const newContact = normalizeContact(contact);

    setContacts((prevContacts) => {
      const alreadyExists = prevContacts.some(
        (prevContact) => prevContact.name === newContact.name
      );

      if (alreadyExists) {
        return prevContacts;
      }

      return [...prevContacts, newContact];
    });
  };

  useEffect(() => {
    if (!userLogin?.nickname) {
      return;
    }

    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (!contact?.is_group) {
          return contact;
        }

        const removedAt = getCurrentUserRemovedAtFromGroup(
          contact.group_data_raw,
          userLogin.nickname
        );
        const isGroupAdmin = isCurrentUserGroupAdmin(
          contact.group_data_raw,
          userLogin.nickname
        );

        return {
          ...contact,
          is_group_member_removed: Boolean(removedAt),
          is_group_admin: isGroupAdmin,
        };
      })
    );
  }, [userLogin?.nickname]);

  const updateContactStatus = (request: any, new_status: any) => {
    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        const isInvolvedReceived =
          contact?.name === request?.to_user &&
          userLogin.nickname === request?.from_user;
        const isInvolvedSend =
          contact?.name === request?.from_user &&
          userLogin.nickname === request?.to_user;

        if (
          (isInvolvedReceived || isInvolvedSend) &&
          contact?.status_request === "pending"
        ) {
          return { ...contact, status_request: new_status };
        }

        return contact;
      })
    );
  };

  const handleSearch = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const deleteContact = (contact: any) => {
    const index = contacts.findIndex(
      (contactFind) => contactFind.name === contact.name
    );
    if (index !== -1) {
      if (contact.is_group) {
        addEvent("delete_group", contact.name);
      } else {
        addEvent("delete_contact", contact.name);
      }
      setContacts((prevContacts) => {
        const newContacts = [...prevContacts];
        newContacts.splice(index, 1);
        if (selectedContact === contact.name) {
          setSelectedContact("");
        }
        return newContacts;
      });
    }
  };

  const handleSelectedContact = (contactName: string) => {
    setSelectedContact(contactName);
  };

  const handleListScroll = (event: any) => {
    const target = event.currentTarget;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

    if (reachedBottom) {
      setVisibleCount((prev) =>
        Math.min(prev + BATCH_SIZE, filteredContacts.length)
      );
    }
  };

  const visibleContacts = filteredContacts.slice(0, visibleCount);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full min-w-0">
      <div className="flex items-center w-full bg-gray-100 shrink-0">
        <Input
          className="my-2 ml-2 mr-1 sm:my-1.5 sm:ml-1.5 lg:my-2 lg:ml-2 flex-1 min-w-0"
          type="text"
          placeholder="Buscar a mis panas"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm ? (
          <Button
            className="bg-red-300 mr-2 sm:mr-1.5 lg:mr-2 shrink-0"
            icon={<CloseOutlined />}
            onClick={clearSearch}
          />
        ) : (
          <Button className="bg-sky-400 mr-2 sm:mr-1.5 lg:mr-2 shrink-0" icon={<SearchOutlined />} />
        )}
      </div>
      <div
        className="flex-1 min-h-0 overflow-auto overscroll-contain w-full p-1"
        style={{ scrollbarWidth: "thin" }}
        onScroll={handleListScroll}
      >
        {visibleContacts.map((contact) => (
          <Fragment key={contact.name}>
            <ConversationTargetItem
              contact={contact}
              isSelected={selectedContact === contact.name}
              onSelect={() => handleSelectedContact(contact.name)}
              onDelete={() => deleteContact(contact)}
            />
            <div className="border-t mb-1 lg:border-t-2"></div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
