import React, { useState } from "react";
import { Button, Modal } from "antd";
import { Phone } from "lucide-react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useEventContext, useEvent } from "../EventContext";

interface CallPanelProps {
  chatName: string;
}

export default function CallPanel({ chatName }: CallPanelProps) {
  const { addEvent, removeEvent } = useEventContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [inRoom, setInRoom] = useState(false);

  // Pushed by the backend (Calls.handle_join_room -> Pomoroom.LiveKit.generate_token/2)
  // once it has confirmed we're allowed to join this chat's room.
  const livekitTokenEvent = useEvent("livekit_token");

  const enterRoom = () => {
    setInRoom(true);
    setModalVisible(true);
    addEvent("join_room", { contact_name: chatName });
  };

  const leaveRoom = () => {
    setInRoom(false);
    setModalVisible(false);
    removeEvent("livekit_token");
    addEvent("leave_room", {});
  };

  return (
    <div>
      <Button
        type="text"
        className={`!h-9 !w-9 !rounded-lg ${inRoom ? "!bg-green-50 !text-green-600" : "text-gray-600 hover:!bg-gray-100"}`}
        icon={<Phone className="h-[18px] w-[18px]" />}
        title={inRoom ? "Mostrar sala" : "Entrar a la sala"}
        onClick={inRoom ? () => setModalVisible(true) : enterRoom}
      />

      <Modal
        open={modalVisible}
        title={`Sala con ${chatName}`}
        centered
        onCancel={() => setModalVisible(false)}
        width="min(720px, 92vw)"
        styles={{ body: { padding: 0 } }}
        footer={null}
      >
        {inRoom && livekitTokenEvent && (
          <LiveKitRoom
            serverUrl={livekitTokenEvent.ws_url}
            token={livekitTokenEvent.token}
            connect
            video={false}
            audio
            data-lk-theme="default"
            style={{ height: "70vh" }}
            onDisconnected={leaveRoom}
          >
            <VideoConference />
          </LiveKitRoom>
        )}
        {inRoom && !livekitTokenEvent && (
          <p className="text-center text-gray-400 text-sm p-6">Conectando…</p>
        )}
      </Modal>
    </div>
  );
}
