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
  refresh_conversations: Record<string, any>;
  logout: boolean;
  group_deleted: { chat_id: string; group_name: string };
  show_user_info: { nickname: string;[key: string]: any };
  add_contact_to_list: ConversationEntry;
  add_group_to_list: ConversationEntry;
  show_list_contact: ConversationEntry[];
  error_adding_contact: string;

  // Kanban
  get_kanban_board: { chat_id: string; chat_type: KanbanChatType };
  add_kanban_column: { chat_id: string; chat_type: KanbanChatType; title: string };
  rename_kanban_column: { chat_id: string; chat_type: KanbanChatType; column_id: string; title: string };
  remove_kanban_column: { chat_id: string; chat_type: KanbanChatType; column_id: string };
  add_kanban_task: { chat_id: string; chat_type: KanbanChatType; column_id: string; title: string };
  move_kanban_task: {
    chat_id: string;
    chat_type: KanbanChatType;
    task_id: string;
    from_column_id: string;
    to_column_id: string;
    new_position: number;
  };
  reorder_kanban_task: {
    chat_id: string;
    chat_type: KanbanChatType;
    task_id: string;
    column_id: string;
    new_position: number;
  };
  rename_kanban_task: { chat_id: string; chat_type: KanbanChatType; task_id: string; title: string };
  delete_kanban_task: { chat_id: string; chat_type: KanbanChatType; task_id: string };
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
}

export type KanbanChatType = "group" | "private";

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
  contact_data?: { nickname: string; chat_id?: string; image_profile?: string;[key: string]: any };
  group_data?: { name: string; chat_id?: string; image?: string; members?: any[]; admin?: string[];[key: string]: any };
  request?: { status: string; to_user: string; from_user: string;[key: string]: any };
  status?: string;
  chat_id?: string;
  is_group?: boolean;
}

export type EventBusPayload<K extends string> = K extends keyof EventBusPayloads
  ? EventBusPayloads[K]
  : any;

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
}

export type OutgoingActionPayload<K extends string> = K extends keyof OutgoingActionPayloads
  ? OutgoingActionPayloads[K]
  : object;

export type PushEventToLiveView = <K extends string>(
  event: K,
  payload: OutgoingActionPayload<K>
) => any;
