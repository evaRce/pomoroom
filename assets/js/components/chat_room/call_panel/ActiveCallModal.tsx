import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useEventContext, useEvent } from "../EventContext";

export default function ActiveCallModal() {
  const { removeEvent } = useEventContext();
  const [modalVisible, setModalVisible] = useState(false);

  const livekitTokenEvent = useEvent("livekit_token");
  const callRoomNameEvent = useEvent("call_room_name");
  const showCallModalEvent = useEvent("show_call_modal");

  useEffect(() => {
    if (livekitTokenEvent) setModalVisible(true);
  }, [livekitTokenEvent]);

  useEffect(() => {
    if (showCallModalEvent) {
      setModalVisible(true);
      removeEvent("show_call_modal");
    }
  }, [showCallModalEvent]);

  if (!livekitTokenEvent) return null;

  const roomName =
    callRoomNameEvent?.chat_id === livekitTokenEvent.chat_id
      ? callRoomNameEvent.name
      : "";

  const leaveCall = () => {
    setModalVisible(false);
    removeEvent("livekit_token");
    removeEvent("call_room_name");
  };

  return (
    <Modal
      open={modalVisible}
      title={roomName ? `Sala con ${roomName}` : "Sala de llamada"}
      centered
      onCancel={() => setModalVisible(false)}
      width="min(720px, 92vw)"
      styles={{ body: { padding: 0 } }}
      footer={null}
    >
      <LiveKitRoom
        serverUrl={livekitTokenEvent.ws_url}
        token={livekitTokenEvent.token}
        connect
        video={false}
        audio
        data-lk-theme="default"
        style={{ height: "70vh" }}
        onDisconnected={leaveCall}
      >
        <VideoConference />
      </LiveKitRoom>
    </Modal>
  );
}
