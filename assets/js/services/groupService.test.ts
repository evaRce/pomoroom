import { describe, expect, it, vi } from "vitest";
import {
  addGroupAction,
  addMemberToGroupAction,
  deleteGroupAction,
  deleteMemberAction,
  requestGroupContactsAction,
  selectGroupChatAction,
  setGroupAdminAction,
} from "./groupService";

describe("groupService", () => {
  it("addGroupAction emits add_group with the group name", () => {
    const addEvent = vi.fn();
    addGroupAction(addEvent, "Study group");
    expect(addEvent).toHaveBeenCalledWith("add_group", { name: "Study group" });
  });

  it("selectGroupChatAction emits selected_group_chat with the group name", () => {
    const addEvent = vi.fn();
    selectGroupChatAction(addEvent, "Study group");
    expect(addEvent).toHaveBeenCalledWith("selected_group_chat", { group_name: "Study group" });
  });

  it("deleteGroupAction emits delete_group with the group name as payload", () => {
    const addEvent = vi.fn();
    deleteGroupAction(addEvent, "Study group");
    expect(addEvent).toHaveBeenCalledWith("delete_group", "Study group");
  });

  it("requestGroupContactsAction emits get_my_contacts with the group name", () => {
    const addEvent = vi.fn();
    requestGroupContactsAction(addEvent, "Study group");
    expect(addEvent).toHaveBeenCalledWith("get_my_contacts", { group_name: "Study group" });
  });

  it("addMemberToGroupAction emits add_member with the new member and group", () => {
    const addEvent = vi.fn();
    addMemberToGroupAction(addEvent, "Study group", "bob01");
    expect(addEvent).toHaveBeenCalledWith("add_member", {
      group_name: "Study group",
      new_member: "bob01",
    });
  });

  it("deleteMemberAction emits delete_member with the member and group", () => {
    const addEvent = vi.fn();
    deleteMemberAction(addEvent, "bob01", "Study group");
    expect(addEvent).toHaveBeenCalledWith("delete_member", {
      member_name: "bob01",
      group_name: "Study group",
    });
  });

  it("setGroupAdminAction emits set_admin with the member, group and operation", () => {
    const addEvent = vi.fn();
    setGroupAdminAction(addEvent, "bob01", "Study group", "promote");
    expect(addEvent).toHaveBeenCalledWith("set_admin", {
      member_name: "bob01",
      group_name: "Study group",
      operation: "promote",
    });
  });
});
