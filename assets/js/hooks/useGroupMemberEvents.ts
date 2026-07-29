import { useEffect, useRef } from "react";
import { refreshConversationsAction } from "../services/contactService";
import { AddEvent, ChatMember, ConversationEntry, EventBusPayloads, RemoveEvent } from "../types/events";

type UseGroupMembershipEventsParams = {
  eventName: string;
  eventData: Record<string, unknown> & {
    contact_list?: ConversationEntry[];
    members_data?: ChatMember[];
    is_admin?: EventBusPayloads["group_member_added"]["is_admin"];
    chat_id?: EventBusPayloads["group_member_removed"]["chat_id"];
    removed_at?: EventBusPayloads["group_member_removed"]["removed_at"];
    group_name?: EventBusPayloads["group_member_removed"]["group_name"];
    message?: EventBusPayloads["group_member_added"]["message"];
  };
  addEvent: AddEvent;
  removeEvent: RemoveEvent;
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
      const membersPayload = { members: eventData?.members_data || [] };
      addEvent(eventName, membersPayload);
      addEvent("members_snapshot", membersPayload);
    }
  }, [eventName, eventData.members_data]);

  useEffect(() => {
    if (eventName === "check_admin") {
      addEvent(eventName, { is_admin: Boolean(eventData?.is_admin) });
    }
  }, [eventName, eventData?.is_admin]);

  useEffect(() => {
    if (eventName === "update_show_my_contacts_and_members") {
      addEvent("show_my_contacts", eventData?.contact_list || []);
      addEvent("show_members", { members: eventData?.members_data || [] });
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

      addEvent(eventName, {
        chat_id: eventData?.chat_id,
        group_name: eventData?.group_name,
        removed_at: eventData?.removed_at,
      });
      refreshConversationsAction(addEvent);
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

      addEvent(eventName, {
        chat_id: eventData?.chat_id,
        group_name: eventData?.group_name,
        is_admin: eventData?.is_admin,
        message: eventData?.message,
      });
      if (typeof eventData?.is_admin === "boolean") {
        addEvent("check_admin", { is_admin: eventData.is_admin });
      }
      removeEvent("group_member_removed");
      refreshConversationsAction(addEvent);
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

      addEvent(eventName, {
        chat_id: eventData?.chat_id || "",
        group_name: eventData?.group_name || "",
      });
      refreshConversationsAction(addEvent);
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
      addEvent(eventName, {
        chat_id: eventData?.chat_id,
        group_name: eventData?.group_name,
        is_admin: eventData?.is_admin,
      });
      refreshConversationsAction(addEvent);
    }
  }, [eventName, eventData]);
}
