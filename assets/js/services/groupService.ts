type AddEvent = (eventName: string, eventData: any) => void;

export function addGroup(addEvent: AddEvent, name: string): void {
  addEvent("add_group", { name });
}

export function selectGroupChat(addEvent: AddEvent, groupName: string): void {
  addEvent("selected_group_chat", { group_name: groupName });
}

export function deleteGroup(addEvent: AddEvent, groupName: string): void {
  addEvent("delete_group", groupName);
}

export function requestGroupContacts(addEvent: AddEvent, groupName: string): void {
  addEvent("get_my_contacts", { group_name: groupName });
}

export function addMemberToGroup(
  addEvent: AddEvent,
  groupName: string,
  newMember: string
): void {
  addEvent("add_member", { group_name: groupName, new_member: newMember });
}

export function deleteMember(
  addEvent: AddEvent,
  memberName: string,
  groupName: string
): void {
  addEvent("delete_member", { member_name: memberName, group_name: groupName });
}

export function setGroupAdmin(
  addEvent: AddEvent,
  memberName: string,
  groupName: string,
  operation: string
): void {
  addEvent("set_admin", {
    member_name: memberName,
    group_name: groupName,
    operation,
  });
}
