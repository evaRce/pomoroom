import { useEffect } from "react";

type UseUserContactsAndGroupsEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
  setUserNickname: (value: string) => void;
};

export function useUserContactsAndGroupsEvents({
  eventName,
  eventData,
  addEvent,
  setUserNickname,
}: UseUserContactsAndGroupsEventsParams) {
  useEffect(() => {
    if (eventName === "show_user_info" && eventData.nickname) {
      setUserNickname(eventData.nickname);
      addEvent(eventName, eventData);
    }
  }, [eventData.nickname]);

  useEffect(() => {
    if (eventName === "add_contact_to_list" && eventData.contact_data) {
      addEvent(eventName, eventData);
    }
  }, [eventData.contact_data, eventData.request]);

  useEffect(() => {
    if (eventName === "add_group_to_list" && eventData.group_data) {
      addEvent(eventName, eventData);
    }
  }, [eventData.group_data, eventData.status]);

  useEffect(() => {
    if (eventName === "show_list_contact" && eventData.all_contact_list) {
      addEvent(eventName, eventData.all_contact_list);
    }
  }, [eventData.all_contact_list]);

  useEffect(() => {
    if (eventName === "error_adding_contact" && eventData.error) {
      addEvent(eventName, eventData.error);
    }
  }, [eventData.error]);

  useEffect(() => {
    if (eventName === "refresh_conversations") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData]);
}
