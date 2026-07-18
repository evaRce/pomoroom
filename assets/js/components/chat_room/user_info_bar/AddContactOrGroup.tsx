import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Input, message, Spin } from "antd";
import { useEventContext, useEvent } from "../EventContext";

export default function AddContactOrGroup({ sendDataToParent, receiveDataFromParent, entryType }) {
  const [form] = Form.useForm();
  const [inputStr, setInputStr] = useState("");
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
      addEvent("send_friend_request", { to_user: inputStr })
    } else if (entryType === "group") {
      addEvent("add_group", { name: inputStr });
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
    setLoading(false);
    setInputStr("");
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
        <Form.Item
          name="newContactName"
          rules={[{ required: true, message: 'Introduce un nombre!' }]}
        >
          <Input
            type="text"
            onChange={e => setInputStr(e.target.value)}
            value={inputStr}
            placeholder={entryType === "contact" ? "Añade tu próximo contacto" : "Añade tu próxima sala"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
