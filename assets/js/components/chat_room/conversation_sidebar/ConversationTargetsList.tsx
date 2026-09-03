import React, { useState, useEffect, Fragment, useRef } from "react";
import { Button } from "antd";
import { SearchOutlined, CloseOutlined, MessageOutlined } from "@ant-design/icons";
import ConversationTargetItem from "./ConversationTargetItem";
import { useEventContext, useEvent } from "../EventContext";
import { deleteContactAction } from "../../../services/contactService";
import { deleteGroupAction } from "../../../services/groupService";
import type { ChatGroupData, ChatUserRef, ConversationEntry } from "../../../types/events";
import useConversationSidebarText from "./conversationSidebarText";
import { useCallContext } from "../call_panel/CallContext";
import { clearMessageNotification, markMessageNotification } from "./messageNotificationStore";

export interface NormalizedContact {
  name: string;
  chat_id: string | null;
  image?: string;
  status_request?: string;
  is_group: boolean;
  is_group_member_removed: boolean;
  is_group_admin: boolean;
  group_data_raw?: ChatGroupData;
}

const INITIAL_BATCH_SIZE = 15;
const BATCH_SIZE = 10;

export default function ConversationTargetsList() {
  const conversationSidebarText = useConversationSidebarText();
  const { addEvent, removeEvent } = useEventContext();
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<NormalizedContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [userLogin, setUserLogin] = useState<Partial<ChatUserRef>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [hasLoadedContacts, setHasLoadedContacts] = useState(false);
  const lastProcessedGroupAdminUpdatedRef = useRef("");

  const addContactToListEvent = useEvent("add_contact_to_list");
  const showListContactEvent = useEvent("show_list_contact");
  const deleteRejectedContactEvent = useEvent("delete_rejected_contact");
  const showUserInfoEvent = useEvent("show_user_info");
  const updateContactStatusAcceptedEvent = useEvent("update_contact_status_to_accepted");
  const updateContactStatusRejectedEvent = useEvent("update_contact_status_to_rejected");
  const deselectContactEvent = useEvent("deselect_contact");
  const closeChatMobileEvent = useEvent("close_chat_mobile");
  const addGroupToListEvent = useEvent("add_group_to_list");
  const groupAdminUpdatedEvent = useEvent("group_admin_updated");
  const showListMessagesEvent = useEvent("show_list_messages");
  const showMessageToSendEvent = useEvent("show_message_to_send");
  const { viewingChatId } = useCallContext();

  const getCurrentUserRemovedAtFromGroup = (groupData: ChatGroupData | undefined, nickname: string | undefined) => {
    if (!groupData || !nickname) {
      return null;
    }

    const members = groupData.members || [];
    const myMember = members.find((member) => member?.user_id === nickname);

    return myMember?.removed_at || null;
  };

  const isCurrentUserGroupAdmin = (groupData: ChatGroupData | undefined, nickname: string | undefined) => {
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
      const normalizedList = showListContactEvent.map((contact) =>
        normalizeContact(contact)
      );
      setContacts(normalizedList);
      setVisibleCount(INITIAL_BATCH_SIZE);
      setHasLoadedContacts(true);
      removeEvent("show_list_contact");
      return;
    }

    if (showListContactEvent) {
      setHasLoadedContacts(true);
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
        updateContactStatusAcceptedEvent?.new_status,
        updateContactStatusAcceptedEvent?.chat_id
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
    if (closeChatMobileEvent) {
      setSelectedContact("");
      removeEvent("close_chat_mobile");
    }
  }, [closeChatMobileEvent]);

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

    clearMessageNotification(showListMessagesEvent.chat_id);
  }, [showListMessagesEvent, contacts]);

  useEffect(() => {
    const eventChatId = showMessageToSendEvent?.message?.data?.chat_id;

    if (!eventChatId) return;

    if (eventChatId !== viewingChatId) {
      markMessageNotification(eventChatId);
    }

    removeEvent("show_message_to_send");
  }, [showMessageToSendEvent, viewingChatId]);

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

  const normalizeContact = (contact: ConversationEntry): NormalizedContact => {
    const groupData = contact?.group_data;
    const removedAt = getCurrentUserRemovedAtFromGroup(groupData, userLogin?.nickname);
    const isGroupAdmin = isCurrentUserGroupAdmin(groupData, userLogin?.nickname);

    return {
      name:
        contact?.contact_data?.nickname ||
        groupData?.name ||
        "",
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

  const addContact = (contact: ConversationEntry) => {
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

  const updateContactStatus = (
    request: { from_user?: string; to_user?: string } | undefined,
    new_status: string | undefined,
    chatId?: string
  ) => {
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
          return {
            ...contact,
            status_request: new_status,
            chat_id: chatId || contact.chat_id,
          };
        }

        return contact;
      })
    );
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const deleteContact = (contact: Pick<NormalizedContact, "name" | "is_group">) => {
    const index = contacts.findIndex(
      (contactFind) => contactFind.name === contact.name
    );
    if (index !== -1) {
      if (contact.is_group) {
        deleteGroupAction(addEvent, contact.name);
      } else {
        deleteContactAction(addEvent, contact.name);
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

  const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
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

  if (hasLoadedContacts && contacts.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full min-w-0 items-center justify-center gap-3 px-6 text-center">
        <MessageOutlined className="text-4xl text-sky-400" aria-hidden="true" />
        <p className="text-lg font-semibold text-gray-700 m-0">
          {conversationSidebarText.emptyStateTitle}
        </p>
        <p className="text-sm text-gray-500 m-0">
          {conversationSidebarText.emptyStateSubtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full min-w-0">
      <div className="flex items-center w-full shrink-0 my-2 px-2 sm:my-1.5 sm:px-1.5 lg:my-2 lg:px-2 landscape-sm:my-1">
        <div className="flex items-center w-full rounded-full bg-gray-200 shadow-sm transition-shadow duration-200 focus-within:shadow-md">
          <input
            className="input bg-transparent border-none h-9 w-full min-w-0 px-4 focus:outline-none shadow-none landscape-sm:h-7 landscape-sm:px-3"
            type="text"
            placeholder={conversationSidebarText.searchPlaceholder}
            aria-label={conversationSidebarText.searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm ? (
            <Button
              className="bg-transparent border-none h-8 w-12 flex items-center justify-center rounded-full mr-1 shrink-0 hover:bg-gray-300 transition-colors duration-200 landscape-sm:!h-6 landscape-sm:!w-10"
              icon={<CloseOutlined />}
              onClick={clearSearch}
              title={conversationSidebarText.clearSearch}
              aria-label={conversationSidebarText.clearSearch}
            />
          ) : (
            <Button
              className="bg-sky-400 hover:bg-sky-500 border-none text-white h-8 w-12 flex items-center justify-center rounded-full mr-1 shrink-0 transition-colors duration-200 landscape-sm:!h-6 landscape-sm:!w-10"
              icon={<SearchOutlined />}
              title={conversationSidebarText.search}
              aria-label={conversationSidebarText.search}
            />
          )}
        </div>
      </div>
      <div
        className="flex-1 min-h-0 overflow-auto overscroll-contain w-full p-1"
        style={{ scrollbarWidth: "thin" }}
        onScroll={handleListScroll}
        role="navigation"
        aria-label={conversationSidebarText.listLabel}
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
