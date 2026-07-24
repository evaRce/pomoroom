import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Radio, message, Spin } from "antd";
import { useEventContext, useEvent } from "../EventContext";
import { sendFriendRequest as sendFriendRequestAction } from "../../../services/contactService";
import { addGroup as addGroupAction } from "../../../services/groupService";

export default function AddContactOrGroup({ sendDataToParent, receiveDataFromParent }) {
  const [form] = Form.useForm();
  const [inputStr, setInputStr] = useState("");
  const [entryType, setEntryType] = useState("contact");
  const { addEvent, removeEvent } = useEventContext();
  const [loading, setLoading] = useState(false);
  const errorAddingContactEvent = useEvent("error_adding_contact");
  const addContactToListEvent = useEvent("add_contact_to_list");
  const addGroupToListEvent = useEvent("add_group_to_list");

  const sendNewEntry = () => {
    if (!inputStr) {
      return;
    }
    setLoading(true);
    if (entryType === "contact") {
      sendFriendRequestAction(addEvent, inputStr)
    } else if (entryType === "group") {
      addGroupAction(addEvent, inputStr);
    }
    setInputStr("");
    form.resetFields();
  };

  const handleAddEntry = () => {
    form.submit();
  };

  const handleCancel = () => {
    sendDataToParent(false);
    form.resetFields();
    setEntryType("contact");
    setLoading(false);
    setInputStr("");
  };

  const handleChangeEntryType = (e) => {
    setEntryType(e.target.value);
  };

  useEffect(() => {
    if (errorAddingContactEvent) {
      form.setFields([
        { name: 'newContactName', errors: [errorAddingContactEvent] }
      ]);
      removeEvent("error_adding_contact");
      setLoading(false);
    }
  }, [errorAddingContactEvent]);

  useEffect(() => {
    if (addContactToListEvent) {
      const messageText = handleContactMessage(addContactToListEvent);
      handleTypeContactMessage(messageText, addContactToListEvent.request.status);
      removeEvent("add_contact_to_list");
      setLoading(false);
    }
  }, [addContactToListEvent]);

  useEffect(() => {
    if (addGroupToListEvent) {
      message.success('Grupo creado exitosamente!', 2);
      removeEvent("add_group_to_list");
      setLoading(false);
    }
  }, [addGroupToListEvent]);

  const handleContactMessage = (data) => {
    if (data.request.status === "accepted") {
      return 'Añade petición de amistad ya aceptada';
    } else if (data.request.status === "rejected") {
      if (data.contact_data.nickname === data.request.to_user) {
        return 'Añade petición de amistad que ya le rechazaron';
      } else {
        return 'Añade petición de amistad que ya rechazo';
      }
    } else {
      if (data.contact_data.nickname === data.request.from_user) {
        return 'Petición de amistad recibida!';
      } else {
        return 'Petición de amistad enviada!';
      }
    }
  };

  const handleTypeContactMessage = (messageText, status) => {
    if (status === "pending") {
      return message.success(messageText, 2);
    } else {
      return message.warning(messageText, 2);
    }
  };

  return (
    <Modal
      title={entryType === "contact" ? "Añadir contacto" : "Crear grupo"}
      open={receiveDataFromParent}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button key="add" onClick={handleAddEntry} disabled={loading}>
          {loading ? <Spin /> : (entryType === "contact" ? "Añadir" : "Crear")}
        </Button>
      ]}
    >
      <Form form={form} onFinish={sendNewEntry}>
        <Form.Item>
          <Radio.Group onChange={handleChangeEntryType} value={entryType}>
            <Radio value="contact">Contacto</Radio>
            <Radio value="group">Grupo</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="newContactName"
          rules={[{ required: true, message: 'Introduce un nombre!' }]}
        >
          <Input
            type="text"
            onChange={e => setInputStr(e.target.value)}
            value={inputStr}
            placeholder={entryType === "contact" ? "Añade a tu proxim@ amig@" : "Añade tu proxima sala"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
