import React, { useState, useEffect } from "react";
import { useEventContext, useEvent } from "../EventContext";
import { Button, Typography } from 'antd';

const { Text } = Typography;

export default function RejectedRequestReceived({ imageNumber }) {
  const { addEvent, removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState(null);
  const rejectedRequestReceivedEvent = useEvent("open_rejected_request_received");

  useEffect(() => {
    if (rejectedRequestReceivedEvent) {
      setRequestData(rejectedRequestReceivedEvent);
      removeEvent("open_rejected_request_received");
    }
  }, [rejectedRequestReceivedEvent]);

  const handleRejectedRequest = () => {
    addEvent("delete_rejected_contact", requestData.to_user);
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col absolute justify-center items-center bg-white p-4 rounded-lg max-w-[80vw] sm:max-w-none text-center">
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