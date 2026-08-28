import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChatSessionEvents } from "./useChatSessionEvents";

function setup(eventName: string, eventData: Record<string, unknown>) {
  const addEvent = vi.fn();
  const setComponent = vi.fn();

  renderHook(() =>
    useChatSessionEvents({
      eventName,
      eventData,
      addEvent,
      userNickname: "eva01",
      setComponent,
    })
  );

  return { addEvent, setComponent };
}

describe("useChatSessionEvents", () => {
  it("opens a private chat and switches to the chat panel", () => {
    const eventData = {
      from_user_data: { nickname: "eva01" },
      to_user_data: { nickname: "bob01" },
      messages: [],
    };
    const { addEvent, setComponent } = setup("open_private_chat", eventData);

    expect(addEvent).toHaveBeenCalledWith("open_private_chat", eventData);
    expect(addEvent).toHaveBeenCalledWith("show_list_messages", eventData);
    expect(addEvent).toHaveBeenCalledWith("open_chat_mobile", expect.any(Number));
    expect(setComponent).toHaveBeenCalledWith("ChatPanel");
  });

  it("opens a group chat, forwards admin status and switches to the chat panel", () => {
    const eventData = {
      group_data: { name: "Study group" },
      is_admin: true,
      messages: [],
    };
    const { addEvent, setComponent } = setup("open_group_chat", eventData);

    expect(addEvent).toHaveBeenCalledWith("open_group_chat", eventData);
    expect(addEvent).toHaveBeenCalledWith("check_admin", { is_admin: true });
    expect(addEvent).toHaveBeenCalledWith("show_list_messages", eventData);
    expect(setComponent).toHaveBeenCalledWith("ChatPanel");
  });

  it("does not open a group chat without group_data", () => {
    const { addEvent, setComponent } = setup("open_group_chat", { is_admin: true });

    expect(addEvent).not.toHaveBeenCalled();
    expect(setComponent).not.toHaveBeenCalled();
  });

  it("forwards show_message_to_send", () => {
    const eventData = { message: { data: { text: "hi" } } };
    const { addEvent } = setup("show_message_to_send", eventData);

    expect(addEvent).toHaveBeenCalledWith("show_message_to_send", eventData);
  });

  it("forwards show_older_messages", () => {
    const eventData = { messages: [], has_more: false };
    const { addEvent } = setup("show_older_messages", eventData);

    expect(addEvent).toHaveBeenCalledWith("show_older_messages", eventData);
  });

  it("forwards show_kanban_board only when a board is present", () => {
    const withBoard = setup("show_kanban_board", { board: { columns: [] } });
    expect(withBoard.addEvent).toHaveBeenCalledWith("show_kanban_board", { board: { columns: [] } });

    const withoutBoard = setup("show_kanban_board", {});
    expect(withoutBoard.addEvent).not.toHaveBeenCalled();
  });

  it("forwards timer_finished pomodoro events", () => {
    const eventData = { chat_id: "c1", timer_id: "t1", state: { mode: "work" } };
    const { addEvent } = setup("timer_finished", eventData);

    expect(addEvent).toHaveBeenCalledWith("timer_finished", eventData);
  });

  it("does nothing for an unrelated event name", () => {
    const { addEvent, setComponent } = setup("some_other_event", {});

    expect(addEvent).not.toHaveBeenCalled();
    expect(setComponent).not.toHaveBeenCalled();
  });
});
