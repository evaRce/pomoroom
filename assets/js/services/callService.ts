type AddEvent = (eventName: string, eventData: any) => void;

export function joinCallRoom(
  addEvent: AddEvent,
  chatId: string,
  chatName: string,
  isGroupChat: boolean
): void {
  addEvent("call_room_name", { chat_id: chatId, name: chatName, is_group: isGroupChat });
  addEvent("join_room", { chat_id: chatId });
}
