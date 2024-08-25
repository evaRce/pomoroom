import React, { useState, useEffect, Fragment } from "react";
import { Button, Input } from "antd";
import { DeleteOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import Contact from "./Contact";
import { useEventContext } from "../../EventContext";

export default function ContactList({ }) {
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, contact: null });
  const [selectedContact, setSelectedContact] = useState(null);
  const [userLogin, setUserLogin] = useState({});

  useEffect(() => {
    const contact = getEventData("add_contact_to_list");
    if (contact) {
      addContact(contact);
      removeEvent("add_contact_to_list");
    }

    const contactList = getEventData("show_list_contact");
    if (contactList) {
      contactList.map(contact =>
        addContact(contact)
      );
      removeEvent("show_list_contact");
    }

    const contactToDelete = getEventData("delete_rejected_contact");
    if (contactToDelete) {
      deleteContact({ name: contactToDelete, is_group: false });
      removeEvent("delete_rejected_contact");
    }

    const userInfo = getEventData("show_user_info");
    if (userInfo) {
      setUserLogin(userInfo);
    }

    const updateRequest = getEventData("update_contact_status");
    if (updateRequest) {
      updateContactStatus(updateRequest.request, updateRequest.new_status);
      removeEvent("update_contact_status");
    }

    const group = getEventData("add_group_to_list");
    if (group) {
      addContact(group);
      removeEvent("add_group_to_list");
    }
  }, [getEventData]);

  useEffect(() => {
    const results = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const addContact = (contact) => {
    const newContact = {
      name: contact.contact_data?.nickname || contact.group_data?.name,
      image: contact.contact_data?.image_profile || contact.group_data?.image,
      status_request: contact.request?.status || contact.status,
      is_group: contact.is_group
    };
    setContacts(prevContacts => [...prevContacts, newContact]);
  };

  const updateContactStatus = (request, new_status) => {
    setContacts(prevContacts =>
      prevContacts.map(contact => {
        const isInvolvedReceived = (contact.name === request.to_user && userLogin.nickname === request.from_user);
        const isInvolvedSend = (contact.name === request.from_user && userLogin.nickname === request.to_user);

        if ((isInvolvedReceived || isInvolvedSend) && contact.status_request === "pending") {
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

  const handleContextMenu = (event, contact) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      contact: contact
    });
  };

  const handleMenuClick = (action) => {
    if (action === "delete") {
      deleteContact(contextMenu.contact);
    }
    setContextMenu({ visible: false, x: 0, y: 0, contact: null });
  };

  const deleteContact = (contact) => {

    const index = contacts.findIndex(contactFind => contactFind.name === contact.name);
    if (index !== -1) {
      if (contact.is_group) {
        addEvent("delete_group", contact.name);
      } else {
        addEvent("delete_contact", contact.name);
      }
      setContacts(prevContacts => {
        const newContacts = [...prevContacts];
        newContacts.splice(index, 1);
        // Restablece la selección si se eliminó el contacto seleccionado
        if (selectedContact === contact.name) {
          setSelectedContact(null);
        }
        return newContacts;
      });
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-[20vw]" onClick={() => setContextMenu({ visible: false, x: 0, y: 0, contact: null })}>
      <div className="flex items-center w-[20vw] bg-gray-100">
        <Input
          className="my-2 ml-2 mr-1 w-[16vw]"
          type="text"
          placeholder="Buscar a mis panas"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm ? (
          <Button className="bg-red-300 mr-2" icon={<CloseOutlined />} onClick={clearSearch} />
        ) : (
          <Button className="bg-sky-400 mr-2" icon={<SearchOutlined />} onClick={handleSearch} />
        )}
      </div>
      <div className="overflow-auto w-[20vw] p-1" style={{ scrollbarWidth: 'thin' }}>
        {filteredContacts.map(contact => (
          <Fragment key={contact.name}>
            <div onContextMenu={(event) => handleContextMenu(event, contact)}>
              <Contact
                contact={contact}
                isSelected={selectedContact === contact.name}
                onSelect={() => setSelectedContact(contact.name)}
              />
            </div>
            <div className='border-t-2 mb-1'></div>
          </Fragment>
        ))}
      </div>
      {contextMenu.visible && (
        <div
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            // boxShadow: '0px 0px 5px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}
        >
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleMenuClick("delete")}
            style={{ width: '100%' }}
          >
            Eliminar contacto
          </Button>
        </div>
      )}
    </div>
  );
}