import { useEffect } from "react";
import { message } from "antd";

type UseErrorNotificationEventsParams = {
  eventName: string;
  eventData: any;
};

const ERROR_EVENT_NAMES = [
  "error_sending_message",
  "error_opening_private_chat",
  "error_accepting_friend_request",
];

export function useErrorNotificationEvents({
  eventName,
  eventData,
}: UseErrorNotificationEventsParams) {
  useEffect(() => {
    if (!ERROR_EVENT_NAMES.includes(eventName) || !eventData) {
      return;
    }

    const errorMessage =
      typeof eventData === "string" ? eventData : Object.values(eventData)[0];

    if (errorMessage) {
      message.error(String(errorMessage), 3);
    }
  }, [eventName, eventData]);
}
