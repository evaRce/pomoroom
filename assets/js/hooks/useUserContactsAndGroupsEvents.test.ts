import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUserContactsAndGroupsEvents } from "./useUserContactsAndGroupsEvents";
import * as contactService from "../services/contactService";

function setup(eventName: string, eventData: Record<string, unknown>) {
  const addEvent = vi.fn();
  const setUserNickname = vi.fn();

  const { rerender } = renderHook(
    (props: { eventName: string; eventData: Record<string, unknown> }) =>
      useUserContactsAndGroupsEvents({
        eventName: props.eventName,
        eventData: props.eventData,
        addEvent,
        setUserNickname,
      }),
    { initialProps: { eventName, eventData } }
  );

  return { addEvent, setUserNickname, rerender };
}

describe("useUserContactsAndGroupsEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets the user nickname and forwards show_user_info", () => {
    const { addEvent, setUserNickname } = setup("show_user_info", {
      nickname: "eva01",
      image_profile: "img.png",
    });

    expect(setUserNickname).toHaveBeenCalledWith("eva01");
    expect(addEvent).toHaveBeenCalledWith("show_user_info", {
      nickname: "eva01",
      image_profile: "img.png",
    });
  });

  it("ignores show_user_info without a nickname", () => {
    const { addEvent, setUserNickname } = setup("show_user_info", {});

    expect(setUserNickname).not.toHaveBeenCalled();
    expect(addEvent).not.toHaveBeenCalled();
  });

  it("forwards add_contact_to_list with contact data and request", () => {
    const contactData = { nickname: "bob01" };
    const request = { from_user: "a", to_user: "b", status: "pending" };
    const { addEvent } = setup("add_contact_to_list", { contact_data: contactData, request });

    expect(addEvent).toHaveBeenCalledWith("add_contact_to_list", { contact_data: contactData, request });
  });

  it("forwards show_list_contact with the full contact list", () => {
    const list = [{ contact_data: { nickname: "bob01" } }];
    const { addEvent } = setup("show_list_contact", { all_contact_list: list });

    expect(addEvent).toHaveBeenCalledWith("show_list_contact", list);
  });

  it("forwards error_adding_contact with the error message", () => {
    const { addEvent } = setup("error_adding_contact", { error: "boom" });

    expect(addEvent).toHaveBeenCalledWith("error_adding_contact", "boom");
  });

  it("forwards refresh_conversations regardless of payload", () => {
    const { addEvent } = setup("refresh_conversations", {});

    expect(addEvent).toHaveBeenCalledWith("refresh_conversations", {});
  });

  it("forwards contact_removed and triggers a conversations refresh", () => {
    const refreshSpy = vi.spyOn(contactService, "refreshConversationsAction");
    const { addEvent } = setup("contact_removed", { contact_name: "bob01", chat_id: "chat-1" });

    expect(addEvent).toHaveBeenCalledWith("contact_removed", { contact_name: "bob01", chat_id: "chat-1" });
    expect(refreshSpy).toHaveBeenCalledWith(addEvent);
  });

  it("defaults contact_removed chat_id to null when absent", () => {
    const { addEvent } = setup("contact_removed", { contact_name: "bob01" });

    expect(addEvent).toHaveBeenCalledWith("contact_removed", { contact_name: "bob01", chat_id: null });
  });

  it("does nothing for an unrelated event name", () => {
    const { addEvent, setUserNickname } = setup("some_other_event", { nickname: "eva01" });

    expect(addEvent).not.toHaveBeenCalled();
    expect(setUserNickname).not.toHaveBeenCalled();
  });
});
