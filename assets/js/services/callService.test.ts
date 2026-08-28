import { describe, expect, it, vi } from "vitest";
import { joinCallRoomAction } from "./callService";

describe("joinCallRoomAction", () => {
  it("emits call_room_name and join_room with the given chat data", () => {
    const addEvent = vi.fn();

    joinCallRoomAction(addEvent, "chat-1", "Team Room", true);

    expect(addEvent).toHaveBeenCalledWith("call_room_name", {
      chat_id: "chat-1",
      name: "Team Room",
      is_group: true,
    });
    expect(addEvent).toHaveBeenCalledWith("join_room", { chat_id: "chat-1" });
    expect(addEvent).toHaveBeenCalledTimes(2);
  });
});
