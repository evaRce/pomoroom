type AddEvent = (eventName: string, eventData: any) => void;
type ChatType = "group" | "private";

export function installChatPluginAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  pluginType: string
): void {
  addEvent("install_chat_plugin", {
    chat_id: chatId,
    chat_type: chatType,
    plugin_type: pluginType,
  });
}

export function uninstallChatPluginAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  pluginId: string
): void {
  addEvent("uninstall_chat_plugin", {
    chat_id: chatId,
    chat_type: chatType,
    plugin_id: pluginId,
  });
}
