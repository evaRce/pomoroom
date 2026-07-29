import React, { useState, useEffect } from "react";
import { useEventContext, useEvent } from "../EventContext";
import { Button, Typography } from 'antd';
import { FriendRequestRef } from "../../../types/events";

const { Text } = Typography;

export default function RejectedRequestReceived({ imageNumber }: { imageNumber: number }) {
  const { addEvent, removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState<FriendRequestRef | null>(null);
  const rejectedRequestReceivedEvent = useEvent("open_rejected_request_received");

  useEffect(() => {
    if (rejectedRequestReceivedEvent) {
      setRequestData(rejectedRequestReceivedEvent);
      removeEvent("open_rejected_request_received");
    }
  }, [rejectedRequestReceivedEvent]);

  const handleRejectedRequest = () => {
    if (!requestData) return;
    addEvent("delete_rejected_contact", requestData.to_user);
  };

  return (
    <div className="flex flex-col flex-1 relative justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="absolute inset-0 object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col items-center bg-white p-4 rounded-lg max-w-[80vw] sm:max-w-none text-center z-10">
        <Text className="text-base sm:text-base md:text-lg lg:text-xl" style={{ color: 'red' }}>
          Tu solicitud de amistad ha sido rechazada por {requestData ? <strong>{requestData.to_user}</strong> : '....'}
        </Text>
        <br></br>
        <Button onClick={handleRejectedRequest}>
          Entendido
        </Button>
      </div>
    </div>
  );
};