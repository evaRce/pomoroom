type AddEvent = (eventName: string, eventData: any) => void;

export function sendMessageToGroupAction(
  addEvent: AddEvent,
  message: string,
  toGroupName: string
): void {
  addEvent("send_message", { message, to_group_name: toGroupName });
}

export function sendMessageToUserAction(
  addEvent: AddEvent,
  message: string,
  toUser: string
): void {
  addEvent("send_message", { message, to_user: toUser });
}

export function loadOlderMessagesAction(
  addEvent: AddEvent,
  chatId: string,
  beforeInsertedAt: string,
  beforeDbId: string
): void {
  addEvent("load_older_messages", {
    chat_id: chatId,
    before_inserted_at: beforeInsertedAt,
    before_db_id: beforeDbId,
  });
}
