import React, { useState, useEffect } from "react";
import { useEventContext } from "../EventContext";
import { Button, Space, Typography } from 'antd';

const { Text } = Typography;

export default function RequestReceived({ imageNumber }) {
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    const request = getEventData("open_chat_request_received");
    if (request) {
      setRequestData(request);
      removeEvent("open_chat_request_received");
    }
  }, [getEventData]);

  const handleStatus = (newStatus) => {
    addEvent("update_status_request", { status: newStatus, contact_name: requestData.to_user, from_user_name: requestData.from_user });
    addEvent("update_contact_status", { request: requestData, new_status: newStatus });
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col absolute justify-center items-center">
        <Text>{requestData ? `${requestData.from_user} te ha enviado una solicitud de amistad.` : 'Cargando...'}</Text>
        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => handleStatus("accepted")}>
            Aceptar
          </Button>
          <Button danger onClick={() => handleStatus("rejected")}>
            Rechazar
          </Button>
        </Space>
      </div>
    </div>
  );
};