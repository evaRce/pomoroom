import { describe, expect, it, vi } from "vitest";
import { loadOlderMessagesAction, sendMessageToGroupAction, sendMessageToUserAction } from "./messageService";

describe("messageService", () => {
  it("sendMessageToGroupAction emits send_message addressed to a group", () => {
    const addEvent = vi.fn();
    sendMessageToGroupAction(addEvent, "hola", "Study group");
    expect(addEvent).toHaveBeenCalledWith("send_message", { message: "hola", to_group_name: "Study group" });
  });

  it("sendMessageToUserAction emits send_message addressed to a user", () => {
    const addEvent = vi.fn();
    sendMessageToUserAction(addEvent, "hola", "bob01");
    expect(addEvent).toHaveBeenCalledWith("send_message", { message: "hola", to_user: "bob01" });
  });

  it("loadOlderMessagesAction emits load_older_messages with the pagination cursor", () => {
    const addEvent = vi.fn();
    loadOlderMessagesAction(addEvent, "chat-1", "2026-01-01T00:00:00Z", "db-1");
    expect(addEvent).toHaveBeenCalledWith("load_older_messages", {
      chat_id: "chat-1",
      before_inserted_at: "2026-01-01T00:00:00Z",
      before_db_id: "db-1",
    });
  });
});
