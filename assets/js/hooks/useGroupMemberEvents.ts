import { useEffect, useRef } from "react";

type UseGroupMembershipEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
  removeEvent: (eventName: string) => void;
};

export function useGroupMembershipEvents({
  eventName,
  eventData,
  addEvent,
  removeEvent,
}: UseGroupMembershipEventsParams) {
  const lastProcessedGroupEventRef = useRef("");

  useEffect(() => {
    if (eventName === "show_my_contacts" && eventData?.contact_list) {
      addEvent(eventName, eventData.contact_list);
    }
  }, [eventName, eventData.contact_list]);

  useEffect(() => {
    if (eventName === "show_members") {
      const membersPayload = { members: eventData?.members_data };
      addEvent(eventName, membersPayload);
      addEvent("members_snapshot", membersPayload);
    }
  }, [eventName, eventData.members_data]);

  useEffect(() => {
    if (eventName === "check_admin") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData?.is_admin]);

  useEffect(() => {
    if (eventName === "update_show_my_contacts_and_members") {
      addEvent("show_my_contacts", eventData?.contact_list);
      addEvent("show_members", { members: eventData?.members_data });
    }
  }, [eventName, eventData]);

  useEffect(() => {
    if (eventName === "group_member_removed") {
      const eventSignature = `${eventName}:${eventData?.chat_id || ""}:${eventData?.removed_at || ""}`;

      if (lastProcessedGroupEventRef.current !== eventSignature) {
        lastProcessedGroupEventRef.current = eventSignature;
      } else {
        return;
      }

      addEvent(eventName, eventData);
      addEvent("refresh_conversations", {});
    }
  }, [eventName, eventData]);

  useEffect(() => {
    if (eventName === "group_member_added") {
      const eventSignature = `${eventName}:${eventData?.chat_id || ""}:${eventData?.group_name || ""}:${String(eventData?.is_admin)}`;

      if (lastProcessedGroupEventRef.current !== eventSignature) {
        lastProcessedGroupEventRef.current = eventSignature;
      } else {
        return;
      }

      addEvent(eventName, eventData);
      if (typeof eventData?.is_admin === "boolean") {
        addEvent("check_admin", { is_admin: eventData.is_admin });
      }
      removeEvent("group_member_removed");
      addEvent("refresh_conversations", {});
    }
  }, [eventName, eventData]);

  useEffect(() => {
    if (eventName === "group_deleted") {
      const eventSignature = `${eventName}:${eventData?.chat_id || ""}:${eventData?.group_name || ""}`;

      if (lastProcessedGroupEventRef.current !== eventSignature) {
        lastProcessedGroupEventRef.current = eventSignature;
      } else {
        return;
      }

      addEvent(eventName, eventData);
      addEvent("refresh_conversations", {});
    }
  }, [eventName, eventData]);

  useEffect(() => {
    if (eventName === "group_admin_updated") {
      const eventSignature = `${eventName}:${eventData?.chat_id || ""}:${eventData?.group_name || ""}:${String(eventData?.is_admin)}`;

      if (lastProcessedGroupEventRef.current !== eventSignature) {
        lastProcessedGroupEventRef.current = eventSignature;
      } else {
        return;
      }

      addEvent("check_admin", { is_admin: Boolean(eventData?.is_admin) });
      addEvent(eventName, eventData);
      addEvent("refresh_conversations", {});
    }
  }, [eventName, eventData]);
}
