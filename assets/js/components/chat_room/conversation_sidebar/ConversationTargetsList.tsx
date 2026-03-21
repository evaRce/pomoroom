import React, { useState, useEffect, Fragment } from "react";
import { Button, Input } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import ConversationTargetItem from "./ConversationTargetItem";
import { useEventContext } from "../EventContext";

export default function ConversationTargetsList() {
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [userLogin, setUserLogin] = useState({});

  useEffect(() => {
    const contact = getEventData("add_contact_to_list");

    if (contact) {
      addContact(contact);
      removeEvent("add_contact_to_list");
    }
  }, [getEventData("add_contact_to_list")]);

  useEffect(() => {
    const contactList = getEventData("show_list_contact");

    if (contactList) {
      contactList.forEach((contact) => addContact(contact));
      removeEvent("show_list_contact");
    }
  }, [getEventData("show_list_contact")]);

  useEffect(() => {
    const contactToDelete = getEventData("delete_rejected_contact");

    if (contactToDelete) {
      deleteContact({ name: contactToDelete, is_group: false });
      removeEvent("delete_rejected_contact");
    }
  }, [getEventData("delete_rejected_contact")]);

  useEffect(() => {
    const userInfo = getEventData("show_user_info");

    if (userInfo) {
      setUserLogin(userInfo);
    }
  }, [getEventData("show_user_info")]);

  useEffect(() => {
    const updateStatusRequest = getEventData(
      "update_contact_status_to_accepted"
    );

    if (updateStatusRequest) {
      updateContactStatus(
        updateStatusRequest?.request,
        updateStatusRequest?.new_status
      );
      removeEvent("update_contact_status_to_accepted");
    }
  }, [getEventData("update_contact_status_to_accepted")]);

  useEffect(() => {
    const updateStatusRequest = getEventData(
      "update_contact_status_to_rejected"
    );
    if (updateStatusRequest) {
      updateContactStatus(
        updateStatusRequest?.request,
        updateStatusRequest?.new_status
      );
      removeEvent("update_contact_status_to_rejected");
    }
  }, [getEventData("update_contact_status_to_rejected")]);

  useEffect(() => {
    const deselectContact = getEventData("deselect_contact");

    if (deselectContact) {
      if (
        deselectContact?.from_user === selectedContact ||
        deselectContact?.to_user === selectedContact
      ) {
        setSelectedContact("");
      }
      removeEvent("deselect_contact");
    }
  }, [getEventData("deselect_contact")]);

  useEffect(() => {
    const group = getEventData("add_group_to_list");

    if (group) {
      addContact(group);
      removeEvent("add_group_to_list");
    }
  }, [getEventData("add_group_to_list")]);

  useEffect(() => {
    const results = contacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const addContact = (contact) => {
    const newContact = {
      name: contact.contact_data?.nickname || contact.group_data?.name,
      image: contact.contact_data?.image_profile || contact.group_data?.image,
      status_request: contact.request?.status || contact.status,
      is_group: contact.is_group,
    };
    setContacts((prevContacts) => [...prevContacts, newContact]);
  };

  const updateContactStatus = (request, new_status) => {
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

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const deleteContact = (contact) => {
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

  const handleSelectedContact = (contactName) => {
    setSelectedContact(contactName);
  };

  return (
    <div className="flex flex-col h-[90vh] w-[20vw]">
      <div className="flex items-center w-[20vw] bg-gray-100">
        <Input
          className="my-2 ml-2 mr-1 lg:w-[18vw] w-[16vw]"
          type="text"
          placeholder="Buscar a mis panas"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm ? (
          <Button
            className="bg-red-300 mr-2"
            icon={<CloseOutlined />}
            onClick={clearSearch}
          />
        ) : (
          <Button className="bg-sky-400 mr-2" icon={<SearchOutlined />} />
        )}
      </div>
      <div
        className="overflow-auto w-[20vw] p-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {filteredContacts.map((contact) => (
          <Fragment key={contact.name}>
            <ConversationTargetItem
              contact={contact}
              isSelected={selectedContact === contact.name}
              onSelect={() => handleSelectedContact(contact.name)}
              onDelete={() => deleteContact(contact)}
            />
            <div className="border-t-2 mb-1"></div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
