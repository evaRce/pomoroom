import { describe, expect, it, vi } from "vitest";
import { installChatPluginAction, uninstallChatPluginAction } from "./chatPluginService";

describe("installChatPluginAction", () => {
  it("emits install_chat_plugin with the chat and plugin details", () => {
    const addEvent = vi.fn();

    installChatPluginAction(addEvent, "chat-1", "group", "kanban");

    expect(addEvent).toHaveBeenCalledWith("install_chat_plugin", {
      chat_id: "chat-1",
      chat_type: "group",
      plugin_type: "kanban",
    });
  });
});

describe("uninstallChatPluginAction", () => {
  it("emits uninstall_chat_plugin with the chat and plugin id", () => {
    const addEvent = vi.fn();

    uninstallChatPluginAction(addEvent, "chat-1", "private", "plugin-9");

    expect(addEvent).toHaveBeenCalledWith("uninstall_chat_plugin", {
      chat_id: "chat-1",
      chat_type: "private",
      plugin_id: "plugin-9",
    });
  });
});
