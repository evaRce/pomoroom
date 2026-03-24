import { useEffect } from "react";

type UseGroupMembershipEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
};

export function useGroupMembershipEvents({
  eventName,
  eventData,
  addEvent,
}: UseGroupMembershipEventsParams) {
  useEffect(() => {
    if (eventName === "show_my_contacts" && eventData.contact_list) {
      addEvent(eventName, eventData.contact_list);
    }
  }, [eventData.contact_list]);

  useEffect(() => {
    if (eventName === "show_members") {
      addEvent(eventName, { members: eventData.members_data });
    }
  }, [eventData.members_data]);

  useEffect(() => {
    if (eventName === "update_show_my_contacts_and_members") {
      addEvent("show_my_contacts", eventData.contact_list);
      addEvent("show_members", { members: eventData.members_data });
    }
  }, [eventData.contact_list, eventData.members_data]);
}
