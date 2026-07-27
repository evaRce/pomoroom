import { useEffect } from "react";
import { AddEvent, EventBusPayloads } from "../types/events";

type UseChatSessionEventsParams = {
  eventName: string;
  eventData: Record<string, unknown>;
  addEvent: AddEvent;
  userNickname: string;
  setComponent: (value: string) => void;
};

export function useChatSessionEvents({
  eventName,
  eventData,
  addEvent,
  userNickname: _userNickname,
  setComponent,
}: UseChatSessionEventsParams) {
  useEffect(() => {
    if (eventName === "open_private_chat") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["open_private_chat"]));
      addEvent("show_list_messages", (eventData as unknown as EventBusPayloads["show_list_messages"]));
      setComponent("ChatPanel");
    }
  }, [eventData.from_user_data, eventData.to_user_data, eventData.messages]);

  useEffect(() => {
    if (eventName === "open_group_chat" && eventData.group_data) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["open_group_chat"]));
      addEvent("check_admin", { is_admin: Boolean(eventData.is_admin) });
      addEvent("show_list_messages", (eventData as unknown as EventBusPayloads["show_list_messages"]));
      setComponent("ChatPanel");
    }
  }, [
    eventData.is_admin,
    eventData.group_data,
    eventData.messages,
    eventData.removed_at,
  ]);

  useEffect(() => {
    if (eventName === "show_message_to_send") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["show_message_to_send"]));
    }
  }, [eventData.message]);

  useEffect(() => {
    if (eventName === "show_older_messages") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["show_older_messages"]));
    }
  }, [eventData.messages, eventData.has_more]);

  useEffect(() => {
    if (eventName === "chat_plugin_installed") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["chat_plugin_installed"]));
    }
  }, [eventName, eventData.chat_id, eventData.plugin]);

  useEffect(() => {
    if (eventName === "chat_plugin_uninstalled") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["chat_plugin_uninstalled"]));
    }
  }, [eventName, eventData.chat_id, eventData.plugin]);

  useEffect(() => {
    if (eventName === "start_timer") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["start_timer"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pause_timer") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["pause_timer"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "reset_timer") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["reset_timer"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "set_mode") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["set_mode"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "update_config") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["update_config"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.config]);

  useEffect(() => {
    if (eventName === "pomodoro_state_loaded") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["pomodoro_state_loaded"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.config]);

  useEffect(() => {
    if (eventName === "timer_finished") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["timer_finished"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pomodoro_timer_state_changed") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["pomodoro_timer_state_changed"]));
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pomodoro_plugin_config_error") {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["pomodoro_plugin_config_error"]));
    }
  }, [eventName, eventData.chat_id, eventData.reason]);

  useEffect(() => {
    if (eventName === "show_kanban_board" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["show_kanban_board"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_board_error" && eventData.reason) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_board_error"]));
    }
  }, [eventName, eventData.reason, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_added" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_column_added"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_renamed" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_column_renamed"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_removed" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_column_removed"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_added" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_task_added"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_moved" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_task_moved"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_reordered" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_task_reordered"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_renamed" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_task_renamed"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_deleted" && eventData.board) {
      addEvent(eventName, (eventData as unknown as EventBusPayloads["kanban_task_deleted"]));
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);
}
