import { describe, expect, it, vi } from "vitest";
import {
  cancelFriendRequestAction,
  deleteContactAction,
  refreshConversationsAction,
  selectPrivateChatAction,
  sendFriendRequestAction,
  toggleDetailVisibilityAction,
  updateFriendRequestStatusAction,
} from "./contactService";

describe("contactService", () => {
  it("deleteContactAction emits delete_contact with the contact name", () => {
    const addEvent = vi.fn();
    deleteContactAction(addEvent, "bob01");
    expect(addEvent).toHaveBeenCalledWith("delete_contact", "bob01");
  });

  it("selectPrivateChatAction emits selected_private_chat with the contact name", () => {
    const addEvent = vi.fn();
    selectPrivateChatAction(addEvent, "bob01");
    expect(addEvent).toHaveBeenCalledWith("selected_private_chat", { contact_name: "bob01" });
  });

  it("sendFriendRequestAction emits send_friend_request with the recipient", () => {
    const addEvent = vi.fn();
    sendFriendRequestAction(addEvent, "bob01");
    expect(addEvent).toHaveBeenCalledWith("send_friend_request", { to_user: "bob01" });
  });

  it("cancelFriendRequestAction emits cancel_friend_request with the recipient", () => {
    const addEvent = vi.fn();
    cancelFriendRequestAction(addEvent, "bob01");
    expect(addEvent).toHaveBeenCalledWith("cancel_friend_request", { to_user: "bob01" });
  });

  it("updateFriendRequestStatusAction emits update_status_request with all fields", () => {
    const addEvent = vi.fn();
    updateFriendRequestStatusAction(addEvent, "accepted", "bob01", "alice02");
    expect(addEvent).toHaveBeenCalledWith("update_status_request", {
      status: "accepted",
      contact_name: "bob01",
      from_user_name: "alice02",
    });
  });

  it("toggleDetailVisibilityAction emits toggle_detail_visibility with all fields", () => {
    const addEvent = vi.fn();
    toggleDetailVisibilityAction(addEvent, true, false, "");
    expect(addEvent).toHaveBeenCalledWith("toggle_detail_visibility", {
      is_visible: true,
      is_group: false,
      group_name: "",
    });
  });

  it("toggleDetailVisibilityAction reports a group toggle correctly", () => {
    const addEvent = vi.fn();
    toggleDetailVisibilityAction(addEvent, false, true, "Study group");
    expect(addEvent).toHaveBeenCalledWith("toggle_detail_visibility", {
      is_visible: false,
      is_group: true,
      group_name: "Study group",
    });
  });

  it("refreshConversationsAction emits refresh_conversations with no payload", () => {
    const addEvent = vi.fn();
    refreshConversationsAction(addEvent);
    expect(addEvent).toHaveBeenCalledWith("refresh_conversations", {});
  });
});
