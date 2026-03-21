import React, { useState, useEffect } from "react";
import { Button, Modal, message } from "antd";
import EmojiPicker from "emoji-picker-react";
import {
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useEventContext } from "../../EventContext";

export default function ChatFooter({ addMessage }) {
  const [inputStr, setInputStr] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [chatData, setChatData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const onEmojiClick = (emojiObject, event) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    const privateChat = getEventData("open_private_chat");

    if (privateChat) {
      setChatData(privateChat);
      removeEvent("open_private_chat");
    }
  }, [getEventData("open_private_chat")]);

  useEffect(() => {
    const groupChat = getEventData("open_group_chat");

    if (groupChat) {
      setChatData(groupChat);
      removeEvent("open_group_chat");
    }
  }, [getEventData("open_group_chat")]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputStr.trim() === "") {
      return;
    }
    console.log(inputStr);
    if (chatData.group_data) {
      addEvent("send_message", {
        message: inputStr,
        to_group_name: chatData.group_data.name,
      });
    } else {
      addEvent("send_message", {
        message: inputStr,
        to_user: chatData.to_user_data.nickname,
      });
    }
    addMessage(inputStr);
    setInputStr("");
  };

  return (
    <footer className="flex justify-between bg-gray-300 h-[7vh] px-4 py-6">
      <form className="flex w-full gap-3" onSubmit={handleSendMessage}>
        <div className="flex items-center gap-2">
          <Button className="bg-gray-100" icon={<PictureOutlined />} />
        </div>
        <div className="flex items-center w-full justify-center">
          <input
            className="input bg-gray-100 h-8 w-full focus:outline-none rounded-r-none"
            type="text"
            value={inputStr}
            onChange={(e) => {
              if (e.target.value.length <= 5000) {
                setInputStr(e.target.value);
              } else {
                setModalVisible(true);
              }
            }}
            placeholder="Type a message..."
            maxLength={5001}
          />
          <div className="flex">
            <Button
              className="bg-gray-100 rounded-none"
              onClick={() => setShowPicker(true)}
              icon={<SmileOutlined />}
            />
            <Button
              className="bg-sky-400 rounded-l-none rounded-r-lg"
              icon={<SendOutlined />}
              onClick={(e) => handleSendMessage(e)}
            />
          </div>
        </div>
      </form>
      <Modal
        title="Elige los emojis"
        open={showPicker}
        onCancel={() => setShowPicker(false)}
        footer={null}
        width={400}
        centered
      >
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </Modal>
      <Modal
        title="Límite de caracteres excedido"
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <p>Se ha excedido el límite de 5000 caracteres.</p>
      </Modal>
    </footer>
  );
}
