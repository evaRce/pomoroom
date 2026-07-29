import React, { useState, useEffect } from "react";
import { useEventContext, useEvent } from "../EventContext";
import { updateFriendRequestStatusAction } from "../../../services/contactService";
import { Button, Space, Typography } from "antd";
import { FriendRequestRef } from "../../../types/events";

const { Text } = Typography;

export default function RequestReceived({ imageNumber }: { imageNumber: number }) {
  const { addEvent, removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState<FriendRequestRef | null>(null);
  const requestReceivedEvent = useEvent("open_chat_request_received");

  useEffect(() => {
    if (requestReceivedEvent) {
      setRequestData(requestReceivedEvent);
      removeEvent("open_chat_request_received");
    }
  }, [requestReceivedEvent]);

  const handleStatus = (newStatus: string) => {
    if (!requestData) return;
    updateFriendRequestStatusAction(addEvent, newStatus, requestData.to_user, requestData.from_user);
  };

  return (
    <div className="flex flex-col flex-1 relative justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="absolute inset-0 object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col items-center bg-white p-4 rounded-lg max-w-[80vw] sm:max-w-none text-center z-10">
        <Text className="text-base sm:text-base md:text-lg lg:text-xl">
          {requestData ? (
            <>
              <strong>{requestData?.from_user}</strong> te ha enviado una
              solicitud de amistad.
            </>
          ) : (
            "Cargando..."
          )}
        </Text>
        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => handleStatus("accepted")}>Aceptar</Button>
          <Button danger onClick={() => handleStatus("rejected")}>
            Rechazar
          </Button>
        </Space>
      </div>
    </div>
  );
}
