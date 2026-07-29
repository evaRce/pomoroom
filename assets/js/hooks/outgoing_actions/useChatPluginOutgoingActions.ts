import { useEffect } from "react";
import { useEvent } from "../../components/chat_room/EventContext";
import { PushEventToLiveView, RemoveEvent } from "../../types/events";

type UseChatPluginOutgoingActionsParams = {
  removeEvent: RemoveEvent;
  pushEventToLiveView: PushEventToLiveView;
};

export function useChatPluginOutgoingActions({
  removeEvent,
  pushEventToLiveView,
}: UseChatPluginOutgoingActionsParams) {
  const installChatPlugin = useEvent("install_chat_plugin");
  const uninstallChatPlugin = useEvent("uninstall_chat_plugin");

  useEffect(() => {
    if (installChatPlugin) {
      pushEventToLiveView("action.install_chat_plugin", installChatPlugin);
      removeEvent("install_chat_plugin");
    }
    if (uninstallChatPlugin) {
      pushEventToLiveView("action.uninstall_chat_plugin", uninstallChatPlugin);
      removeEvent("uninstall_chat_plugin");
    }
  }, [installChatPlugin, uninstallChatPlugin, pushEventToLiveView, removeEvent]);
}
