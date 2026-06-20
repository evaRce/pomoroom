import { useEffect } from "react";

type UseChatSessionEventsParams = {
  eventName: string;
  eventData: any;
  addEvent: (eventName: string, eventData: any) => void;
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
      addEvent(eventName, eventData);
      addEvent("show_list_messages", eventData);
      setComponent("ChatPanel");
    }
  }, [eventData.from_user_data, eventData.to_user_data, eventData.messages]);

  useEffect(() => {
    if (eventName === "open_group_chat" && eventData.group_data) {
      addEvent(eventName, eventData);
      addEvent("check_admin", { is_admin: eventData.is_admin });
      addEvent("show_list_messages", eventData);
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
      addEvent(eventName, eventData);
    }
  }, [eventData.message]);

  useEffect(() => {
    if (eventName === "show_older_messages") {
      addEvent(eventName, eventData);
    }
  }, [eventData.messages, eventData.has_more]);

  useEffect(() => {
    if (eventName === "chat_plugin_installed") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.plugin]);

  useEffect(() => {
    if (eventName === "chat_plugin_uninstalled") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.plugin]);

  useEffect(() => {
    if (eventName === "start_timer") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pause_timer") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "reset_timer") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "set_mode") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "update_config") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.config]);

  useEffect(() => {
    if (eventName === "pomodoro_state_loaded") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.config]);

  useEffect(() => {
    if (eventName === "timer_finished") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pomodoro_timer_state_changed") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.timer_id, eventData.state]);

  useEffect(() => {
    if (eventName === "pomodoro_plugin_config_error") {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.chat_id, eventData.reason]);

  useEffect(() => {
    if (eventName === "show_kanban_board" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_board_error" && eventData.reason) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.reason, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_added" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_renamed" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_column_removed" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_added" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_moved" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_reordered" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_renamed" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);

  useEffect(() => {
    if (eventName === "kanban_task_deleted" && eventData.board) {
      addEvent(eventName, eventData);
    }
  }, [eventName, eventData.board, eventData.chat_id, eventData.chat_type]);
}
