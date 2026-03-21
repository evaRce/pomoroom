import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Radio, message, Spin } from "antd";
import { useEventContext } from "../EventContext";

export default function AddContactOrGroup({ sendDataToParent, receiveDataFromParent }) {
  const [form] = Form.useForm();
  const [inputStr, setInputStr] = useState("");
  const [entryType, setEntryType] = useState("contact");
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [loading, setLoading] = useState(false);

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
    setEntryType("contact");
    setLoading(false);
    setInputStr("");
  };

  const handleChangeEntryType = (e) => {
    setEntryType(e.target.value);
  };

  useEffect(() => {
    const errorContact = getEventData("error_adding_contact");
    if (errorContact) {
      form.setFields([
        { name: 'newContactName', errors: [errorContact] }
      ]);
      removeEvent("error_adding_contact");
      setLoading(false);
    }
  }, [getEventData("error_adding_contact")]);

  useEffect(() => {
    const successContact = getEventData("add_contact_to_list");
    
    if (successContact) {
      const messageText = handleContactMessage(successContact);
      handleTypeContactMessage(messageText, successContact.request.status);
      removeEvent("add_contact_to_list");
      setLoading(false);
    }
    
  }, [getEventData("add_contact_to_list")]);

  useEffect(() => {
    const successGroup = getEventData("add_group_to_list");
    if (successGroup) {
      message.success('Grupo creado exitosamente!', 2);
      removeEvent("add_group_to_list");
      setLoading(false);
    }
  }, [getEventData("add_group_to_list")]);

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
