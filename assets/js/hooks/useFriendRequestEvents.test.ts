import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFriendRequestEvents } from "./useFriendRequestEvents";

function setup(
  eventName: string,
  eventData: Record<string, unknown>,
  overrides: { userNickname?: string; infoChatSelected?: { contact_name?: string; group_name?: string } } = {}
) {
  const addEvent = vi.fn();
  const setIsVisibleDetail = vi.fn();
  const setComponent = vi.fn();

  renderHook(() =>
    useFriendRequestEvents({
      eventName,
      eventData,
      addEvent,
      userNickname: overrides.userNickname ?? "eva01",
      setIsVisibleDetail,
      setComponent,
      infoChatSelected: overrides.infoChatSelected ?? {},
    })
  );

  return { addEvent, setIsVisibleDetail, setComponent };
}

describe("useFriendRequestEvents", () => {
  it("opens the sent-request panel when the current user is the sender", () => {
    const request = { from_user: "eva01", to_user: "bob01", status: "pending" };
    const { addEvent, setIsVisibleDetail, setComponent } = setup(
      "open_chat_request_send",
      { request },
      { userNickname: "eva01" }
    );

    expect(addEvent).toHaveBeenCalledWith("open_chat_request_send", request);
    expect(setIsVisibleDetail).toHaveBeenCalledWith(false);
    expect(setComponent).toHaveBeenCalledWith("RequestSend");
  });

  it("ignores open_chat_request_send when the current user is not the sender", () => {
    const request = { from_user: "bob01", to_user: "carol", status: "pending" };
    const { addEvent, setComponent } = setup("open_chat_request_send", { request }, { userNickname: "eva01" });

    expect(addEvent).not.toHaveBeenCalled();
    expect(setComponent).not.toHaveBeenCalled();
  });

  it("opens the received-request panel when the current user is the recipient", () => {
    const request = { from_user: "bob01", to_user: "eva01", status: "pending" };
    const { addEvent, setComponent } = setup(
      "open_chat_request_received",
      { request },
      { userNickname: "eva01" }
    );

    expect(addEvent).toHaveBeenCalledWith("open_chat_request_received", request);
    expect(setComponent).toHaveBeenCalledWith("RequestReceived");
  });

  it("marks a rejected sent request and updates status, opening the panel when it's the selected chat", () => {
    const rejected_request = { from_user: "eva01", to_user: "bob01", status: "rejected" };
    const { addEvent, setComponent } = setup(
      "open_rejected_request_send",
      { rejected_request },
      { userNickname: "bob01", infoChatSelected: { contact_name: "eva01" } }
    );

    expect(addEvent).toHaveBeenCalledWith("open_rejected_request_send", rejected_request);
    expect(addEvent).toHaveBeenCalledWith("update_contact_status_to_rejected", {
      request: rejected_request,
      new_status: "rejected",
    });
    expect(setComponent).toHaveBeenCalledWith("RejectedRequestSend");
  });

  it("accepts a friend request, clears the component and deselects the contact", () => {
    const request = { from_user: "bob01", to_user: "eva01", status: "accepted" };
    const { addEvent, setComponent } = setup("update_contact_status_to_accepted", {
      request,
      new_status: "accepted",
    });

    expect(addEvent).toHaveBeenCalledWith("update_contact_status_to_accepted", {
      request,
      new_status: "accepted",
    });
    expect(setComponent).toHaveBeenCalledWith("");
    expect(addEvent).toHaveBeenCalledWith("deselect_contact", { from_user: "bob01", to_user: "eva01" });
  });
});
