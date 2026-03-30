import { useEffect } from "react";

type UseChatSessionEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
  isVisibleDetail: boolean;
  userName: string;
  setComponent: (value: string) => void;
};

export function useChatSessionEvents({
  eventName,
  eventData,
  addEvent,
  isVisibleDetail,
  userName,
  setComponent,
}: UseChatSessionEventsParams) {
  useEffect(() => {
    if (eventName === "open_private_chat") {
      addEvent(eventName, eventData);
      addEvent("show_list_messages", eventData);
      if (isVisibleDetail) {
        if (userName === eventData.from_user_data.nickname) {
          addEvent("show_detail", {
            chat_name: eventData.to_user_data.nickname,
            image: eventData.to_user_data.image_profile,
            is_group: false,
          });
        } else {
          addEvent("show_detail", {
            chat_name: eventData.from_user_data.nickname,
            image: eventData.from_user_data.image_profile,
            is_group: false,
          });
        }
      }
      setComponent("ChatPanel");
    }
  }, [eventData.from_user_data, eventData.to_user_data, eventData.messages]);

  useEffect(() => {
    if (eventName === "open_group_chat" && eventData.group_data) {
      addEvent(eventName, eventData);
      addEvent("check_admin", { is_admin: eventData.is_admin });
      addEvent("show_list_messages", eventData);
      if (isVisibleDetail) {
        addEvent("show_detail", {
          chat_name: eventData.group_data.name,
          image: eventData.group_data.image,
          is_group: true,
        });
        addEvent("show_members", { members: eventData.members_data });
      }
      setComponent("ChatPanel");
    }
  }, [
    eventData.is_admin,
    eventData.group_data,
    eventData.messages,
    eventData.members_data,
  ]);

  useEffect(() => {
    if (eventName === "show_message_to_send") {
      addEvent(eventName, eventData);
    }
  }, [eventData.message]);

  useEffect(() => {
    if (eventName === "show_older_messages") {
      addEvent(eventName, eventData);
    }
  }, [eventData.messages, eventData.has_more]);
}
