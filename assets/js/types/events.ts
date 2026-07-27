export interface EventBusPayloads {
  // Calls
  join_room: { chat_id: string };
  call_room_name: { chat_id: string; name: string; is_group: boolean };
  livekit_token: { token: string; ws_url: string; chat_id: string };

  // Contacts and groups
  delete_contact: string;
  selected_private_chat: { contact_name: string };
  send_friend_request: { to_user: string };
  update_status_request: { status: string; contact_name: string; from_user_name: string };
  toggle_detail_visibility: { is_visible: boolean; is_group: boolean; group_name: string };
  add_group: { name: string };
  selected_group_chat: { group_name: string };
  delete_group: string;
  get_my_contacts: { group_name: string };
  add_member: { group_name: string; new_member: string };
  delete_member: { member_name: string; group_name: string };
  set_admin: { member_name: string; group_name: string; operation: string };
  refresh_conversations: Record<string, never>;
  logout: boolean;
  group_deleted: { chat_id: string; group_name: string };
  show_user_info: ChatUserRef;
  add_contact_to_list: ConversationEntry;
  add_group_to_list: ConversationEntry;
  show_list_contact: ConversationEntry[];
  error_adding_contact: string;

  // Kanban
  get_kanban_board: { chat_id: string; chat_type: ChatType };
  add_kanban_column: { chat_id: string; chat_type: ChatType; title: string };
  rename_kanban_column: { chat_id: string; chat_type: ChatType; column_id: string; title: string };
  remove_kanban_column: { chat_id: string; chat_type: ChatType; column_id: string };
  add_kanban_task: { chat_id: string; chat_type: ChatType; column_id: string; title: string };
  move_kanban_task: {
    chat_id: string;
    chat_type: ChatType;
    task_id: string;
    from_column_id: string;
    to_column_id: string;
    new_position: number;
  };
  reorder_kanban_task: {
    chat_id: string;
    chat_type: ChatType;
    task_id: string;
    column_id: string;
    new_position: number;
  };
  rename_kanban_task: { chat_id: string; chat_type: ChatType; task_id: string; title: string };
  delete_kanban_task: { chat_id: string; chat_type: ChatType; task_id: string };
  show_kanban_board: { board: KanbanServerBoard };
  kanban_board_error: { reason: string };
  kanban_column_added: { board: KanbanServerBoard };
  kanban_column_renamed: { board: KanbanServerBoard };
  kanban_column_removed: { board: KanbanServerBoard };
  kanban_task_added: { board: KanbanServerBoard };
  kanban_task_moved: { board: KanbanServerBoard };
  kanban_task_reordered: { board: KanbanServerBoard };
  kanban_task_renamed: { board: KanbanServerBoard };
  kanban_task_deleted: { board: KanbanServerBoard };

  // Messages and chat session
  send_message: { message: string; to_group_name: string } | { message: string; to_user: string };
  load_older_messages: { chat_id: string; before_inserted_at: string; before_db_id: string };
  open_private_chat: ChatSessionData;
  open_group_chat: ChatSessionData;
  active_chat_context: ChatSessionData;
  show_list_messages: ChatSessionData;
  show_older_messages: { messages?: ChatMessage[]; has_more?: boolean };
  show_message_to_send: { message: ChatMessage };

  // Pomodoro plugin
  get_pomodoro_state: { chat_id: string; chat_type: ChatType };
  start_pomodoro_timer: { chat_id: string; chat_type: ChatType };
  pause_pomodoro_timer: { chat_id: string; chat_type: ChatType };
  reset_pomodoro_timer: { chat_id: string; chat_type: ChatType };
  set_pomodoro_timer_mode: { chat_id: string; chat_type: ChatType; mode: string };
  update_pomodoro_plugin_config: {
    timer_id: string;
    chat_id: string;
    chat_type: ChatType;
    expected_config_version: number;
    config: PomodoroConfigPayload;
  };
  pomodoro_state_loaded: PomodoroServerPayload;
  start_timer: PomodoroServerPayload;
  pause_timer: PomodoroServerPayload;
  reset_timer: PomodoroServerPayload;
  set_mode: PomodoroServerPayload;
  update_config: PomodoroServerPayload;
  timer_finished: PomodoroServerPayload;
  pomodoro_timer_state_changed: PomodoroServerPayload;
  pomodoro_plugin_config_error: { chat_id: string; chat_type: ChatType; reason: string };

  // Chat plugins (install/uninstall)
  install_chat_plugin: { chat_id: string; chat_type: ChatType; plugin_type: string };
  uninstall_chat_plugin: { chat_id: string; chat_type: ChatType; plugin_id: string };
  chat_plugin_installed: { chat_id: string; plugin: ChatPluginRef };
  chat_plugin_install_failed: { chat_id: string; reason: string };
  chat_plugin_uninstalled: { chat_id: string; plugin: ChatPluginRef };
  chat_plugin_uninstall_failed: { chat_id: string; reason: string };

  // Friend requests
  open_chat_request_send: FriendRequestRef;
  open_chat_request_received: FriendRequestRef;
  open_rejected_request_send: FriendRequestRef;
  open_rejected_request_received: FriendRequestRef;
  delete_rejected_contact: string;
  update_contact_status_to_accepted: { request: FriendRequestRef; new_status: string };
  update_contact_status_to_rejected: { request: FriendRequestRef; new_status: string };
  deselect_contact: { from_user: string; to_user: string };

  // Group membership
  show_my_contacts: ConversationEntry[];
  show_members: { members: ChatMember[] };
  members_snapshot: { members: ChatMember[] };
  check_admin: { is_admin: boolean };
  show_detail: { chat_name: string; image: string; is_group: boolean; chat_id: string; group_name: string };
  group_admin_updated: { chat_id?: string; group_name?: string; is_admin?: boolean };
  group_member_removed: { chat_id?: string; group_name?: string; removed_at?: string };
  group_member_added: { chat_id?: string; group_name?: string; is_admin?: boolean; message?: string };
}

export interface FriendRequestRef {
  from_user: string;
  to_user: string;
  status?: string;
}

export interface PomodoroConfigPayload {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  cycles_before_long_break: number;
}

export interface PomodoroServerPayload {
  chat_id: string;
  timer_id?: string;
  config_version?: number;
  server_now?: number;
  config?: Partial<PomodoroConfigPayload>;
  state?: {
    mode?: string;
    is_running?: boolean;
    started_at?: number | null;
    paused_at?: number | null;
    duration_ms?: number;
    mode_snapshots?: Record<string, number>;
    session_elapsed_ms?: number;
    session_started_at?: number | null;
    last_completed_mode?: string;
    lastCompletedMode?: string;
    last_updated?: number;
    time_left?: number;
    cycles_completed?: number;
    has_pending_work_half_cycle?: boolean;
    settings?: Partial<PomodoroConfigPayload>;
    server_now?: number;
  };
  reason?: string;
  chat_type?: ChatType;
}

export interface ChatPluginRef {
  id?: string;
  type: string;
  name?: string;
  icon?: string;
}

export interface ChatUserRef {
  nickname: string;
  chat_id?: string;
  image_profile?: string;
}

export interface ChatMember {
  nickname: string;
  user_id?: string;
  image_profile?: string;
  is_admin?: boolean;
  removed_at?: string | null;
}

export interface ChatMessageData {
  msg_id?: string;
  db_id?: string;
  chat_id?: string;
  from_user: string;
  text: string;
  inserted_at: string;
}

export interface ChatMessage {
  data: ChatMessageData;
  image_user?: string;
}

export interface ChatGroupData {
  name: string;
  chat_id?: string;
  image?: string;
  invite_link?: string;
  members?: ChatMember[];
  admin?: string[];
}

export interface ChatSessionData {
  chat_id?: string;
  messages?: ChatMessage[];
  removed_at?: string | null;
  is_admin?: boolean;
  plugins?: ChatPluginRef[];
  group_data?: ChatGroupData;
  from_user_data?: ChatUserRef;
  to_user_data?: ChatUserRef;
  user_avatar_map?: Record<string, string>;
  has_more?: boolean;
}

export type ChatType = "group" | "private";

export interface KanbanServerColumn {
  column_id?: string;
  columnId?: string;
  title?: string;
  tasks?: Array<{ task_id?: string; id?: string; title?: string }>;
}

export interface KanbanServerBoard {
  columns?: KanbanServerColumn[];
}

export interface ConversationEntry {
  contact_data?: ChatUserRef;
  group_data?: ChatGroupData;
  request?: FriendRequestRef & { status: string };
  status?: string;
  chat_id?: string;
  is_group?: boolean;
}

export type EventBusPayload<K extends string> = K extends keyof EventBusPayloads
  ? EventBusPayloads[K]
  : unknown;

export type AddEvent = <K extends string>(
  eventName: K,
  eventData: EventBusPayload<K> | ((prev: EventBusPayload<K>) => EventBusPayload<K>)
) => void;

export type RemoveEvent = (eventName: string) => void;

export interface OutgoingActionPayloads {
  // Calls
  "action.join_room": { chat_id: string };

  // Contacts and groups
  "action.delete_contact": string;
  "action.selected_private_chat": { contact_name: string };
  "action.send_friend_request": { to_user: string };
  "action.update_status_request": { status: string; contact_name: string; from_user_name: string };
  "action.get_members": { is_visible: boolean; is_group: boolean; group_name: string };
  "action.add_group": { name: string };
  "action.selected_group_chat": { group_name: string };
  "action.delete_group": string;
  "action.get_my_contacts": { group_name: string };
  "action.add_member": { group_name: string; new_member: string };
  "action.delete_member": { member_name: string; group_name: string };
  "action.set_admin": { member_name: string; group_name: string; operation: string };
  "action.get_list_contact": Record<string, never>;
  "action.logout": Record<string, never>;

  // Kanban
  "action.get_kanban_board": EventBusPayloads["get_kanban_board"];
  "action.add_kanban_column": EventBusPayloads["add_kanban_column"];
  "action.rename_kanban_column": EventBusPayloads["rename_kanban_column"];
  "action.remove_kanban_column": EventBusPayloads["remove_kanban_column"];
  "action.add_kanban_task": EventBusPayloads["add_kanban_task"];
  "action.move_kanban_task": EventBusPayloads["move_kanban_task"];
  "action.reorder_kanban_task": EventBusPayloads["reorder_kanban_task"];
  "action.rename_kanban_task": EventBusPayloads["rename_kanban_task"];
  "action.delete_kanban_task": EventBusPayloads["delete_kanban_task"];

  // Messages
  "action.send_message": EventBusPayloads["send_message"];
  "action.load_older_messages": EventBusPayloads["load_older_messages"];

  // Pomodoro plugin
  "action.get_pomodoro_state": EventBusPayloads["get_pomodoro_state"];
  "action.start_pomodoro_timer": EventBusPayloads["start_pomodoro_timer"];
  "action.pause_pomodoro_timer": EventBusPayloads["pause_pomodoro_timer"];
  "action.reset_pomodoro_timer": EventBusPayloads["reset_pomodoro_timer"];
  "action.set_pomodoro_timer_mode": EventBusPayloads["set_pomodoro_timer_mode"];
  "action.update_pomodoro_plugin_config": EventBusPayloads["update_pomodoro_plugin_config"];

  // Chat plugins
  "action.install_chat_plugin": EventBusPayloads["install_chat_plugin"];
  "action.uninstall_chat_plugin": EventBusPayloads["uninstall_chat_plugin"];
}

export type OutgoingActionPayload<K extends string> = K extends keyof OutgoingActionPayloads
  ? OutgoingActionPayloads[K]
  : object;

export type PushEventToLiveView = <K extends string>(
  event: K,
  payload: OutgoingActionPayload<K>
) => any;
