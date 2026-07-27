import { useEffect } from "react";
import { AddEvent, ChatUserRef, ConversationEntry } from "../types/events";

type UseUserContactsAndGroupsEventsParams = {
  eventName: string;
  eventData: Record<string, unknown> & {
    nickname?: ChatUserRef["nickname"];
    image_profile?: ChatUserRef["image_profile"];
    contact_data?: ConversationEntry["contact_data"];
    request?: ConversationEntry["request"];
    group_data?: ConversationEntry["group_data"];
    status?: ConversationEntry["status"];
    all_contact_list?: ConversationEntry[];
    error?: string;
  };
  addEvent: AddEvent;
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
      addEvent(eventName, { nickname: eventData.nickname, image_profile: eventData.image_profile });
    }
  }, [eventData.nickname]);

  useEffect(() => {
    if (eventName === "add_contact_to_list" && eventData.contact_data) {
      addEvent(eventName, { contact_data: eventData.contact_data, request: eventData.request });
    }
  }, [eventData.contact_data, eventData.request]);

  useEffect(() => {
    if (eventName === "add_group_to_list" && eventData.group_data) {
      addEvent(eventName, { group_data: eventData.group_data, status: eventData.status });
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
      addEvent(eventName, {});
    }
  }, [eventName, eventData]);
}
