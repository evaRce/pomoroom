import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGroupMembershipEvents } from "./useGroupMemberEvents";
import * as contactService from "../services/contactService";

vi.mock("antd", () => ({
  message: {
    info: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function setup(eventName: string, eventData: Record<string, unknown>) {
  const addEvent = vi.fn();
  const removeEvent = vi.fn();

  renderHook(() => useGroupMembershipEvents({ eventName, eventData, addEvent, removeEvent }));

  return { addEvent, removeEvent };
}

describe("useGroupMembershipEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards show_my_contacts with the contact list", () => {
    const contact_list = [{ contact_data: { nickname: "bob01" } }];
    const { addEvent } = setup("show_my_contacts", { contact_list });

    expect(addEvent).toHaveBeenCalledWith("show_my_contacts", contact_list);
  });

  it("forwards show_members and mirrors it into members_snapshot", () => {
    const members_data = [{ nickname: "bob01" }];
    const { addEvent } = setup("show_members", { members_data });

    expect(addEvent).toHaveBeenCalledWith("show_members", { members: members_data });
    expect(addEvent).toHaveBeenCalledWith("members_snapshot", { members: members_data });
  });

  it("normalizes check_admin to a boolean", () => {
    const { addEvent } = setup("check_admin", { is_admin: undefined });

    expect(addEvent).toHaveBeenCalledWith("check_admin", { is_admin: false });
  });

  it("refreshes conversations once for a given group_member_removed event", () => {
    const refreshSpy = vi.spyOn(contactService, "refreshConversationsAction");
    const eventData = { chat_id: "chat-1", group_name: "Study group", removed_at: "2026-01-01" };
    const { addEvent } = setup("group_member_removed", eventData);

    expect(addEvent).toHaveBeenCalledWith("group_member_removed", eventData);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("refreshes conversations and updates admin status for group_member_added", () => {
    const refreshSpy = vi.spyOn(contactService, "refreshConversationsAction");
    const eventData = { chat_id: "chat-1", group_name: "Study group", is_admin: true, message: "welcome" };
    const { addEvent, removeEvent } = setup("group_member_added", eventData);

    expect(addEvent).toHaveBeenCalledWith("group_member_added", eventData);
    expect(addEvent).toHaveBeenCalledWith("check_admin", { is_admin: true });
    expect(removeEvent).toHaveBeenCalledWith("group_member_removed");
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("announces group_deleted and refreshes conversations", () => {
    const refreshSpy = vi.spyOn(contactService, "refreshConversationsAction");
    const eventData = { chat_id: "chat-1", group_name: "Study group" };
    const { addEvent } = setup("group_deleted", eventData);

    expect(addEvent).toHaveBeenCalledWith("group_deleted", eventData);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
