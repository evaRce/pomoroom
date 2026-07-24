type AddEvent = (eventName: string, eventData: any) => void;

export function deleteContact(addEvent: AddEvent, contactName: string): void {
  addEvent("delete_contact", contactName);
}

export function selectPrivateChat(addEvent: AddEvent, contactName: string): void {
  addEvent("selected_private_chat", { contact_name: contactName });
}

export function sendFriendRequest(addEvent: AddEvent, toUser: string): void {
  addEvent("send_friend_request", { to_user: toUser });
}

export function updateFriendRequestStatus(
  addEvent: AddEvent,
  status: string,
  contactName: string,
  fromUserName: string
): void {
  addEvent("update_status_request", {
    status,
    contact_name: contactName,
    from_user_name: fromUserName,
  });
}

export function toggleDetailVisibility(
  addEvent: AddEvent,
  isVisible: boolean,
  isGroup: boolean,
  groupName: string
): void {
  addEvent("toggle_detail_visibility", {
    is_visible: isVisible,
    is_group: isGroup,
    group_name: groupName,
  });
}

export function refreshConversations(addEvent: AddEvent): void {
  addEvent("refresh_conversations", {});
}
