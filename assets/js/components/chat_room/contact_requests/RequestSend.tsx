import React, { useState, useEffect } from "react";
import { useEventContext, useEvent } from "../EventContext";
import { Typography } from 'antd';

const { Text } = Typography;

export default function RequestSend({ imageNumber }) {
  const { removeEvent } = useEventContext();
  const [requestData, setRequestData] = useState({});
  const requestSendEvent = useEvent("open_chat_request_send");

  useEffect(() => {
    if (requestSendEvent) {
      setRequestData(requestSendEvent);
      removeEvent("open_chat_request_send");
    }
  }, [requestSendEvent]);

  return (
    <div className="flex flex-col flex-1 justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="object-cover w-full h-full opacity-45"
      />
      <div className="flex flex-col absolute justify-center items-center bg-white p-4 rounded-lg max-w-[80vw] sm:max-w-none text-center">
        <Text className="text-base sm:text-base md:text-lg lg:text-xl">
          Has enviado una solicitud de amistad a {requestData ? <strong>{requestData.to_user}</strong> : '...'}.
          <br></br>
          Esperando respuesta.
        </Text>
      </div>
    </div>
  );
}