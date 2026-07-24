import React, { useState, useEffect } from "react";
import { useEventContext, useEvent } from "../EventContext";
import { Button, Typography } from 'antd';
import { FriendRequestRef } from "../../../types/events";

const { Text } = Typography;

export default function RejectedRequestSend({ imageNumber }: { imageNumber: number }) {
  const { addEvent, removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState<FriendRequestRef | null>(null);
  const rejectedRequestSendEvent = useEvent("open_rejected_request_send");

  useEffect(() => {
    if (rejectedRequestSendEvent) {
      setRequestData(rejectedRequestSendEvent);
      removeEvent("open_rejected_request_send");
    }
  }, [rejectedRequestSendEvent]);

  const handleRejectedRequest = () => {
    if (!requestData) return;
    addEvent("delete_rejected_contact", requestData.from_user);
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col absolute justify-center items-center bg-white p-4 rounded-lg">
        <Text className="text-base sm:text-base md:text-lg lg:text-xl" style={{ color: 'red' }}>
          Has rechazado la solicitud de amistad de {requestData ? <strong>{requestData.from_user}</strong> : '...'}
        </Text>
        <br></br>
        <Button onClick={handleRejectedRequest}>
          Entendido
        </Button>
      </div>
    </div>
  );
};