import { useEffect } from "react";
import { useEventContext, useEvent } from "../components/chat_room/EventContext";
import { clearAllTimers, clearRequestedConfigs } from "../components/chat_room/pomodoro_timer/pomodoroTimerStore";
import { clearAllPomodoroNotifications } from "../components/chat_room/pomodoro_timer/pomodoroNotificationStore";

type UseOutgoingLiveViewActionsParams = {
  getEventData: (eventName: string) => any;
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
  infoChatSelected: any;
  isVisibleDetail: boolean;
  setIsVisibleDetail: (value: boolean) => void;
  setInfoChatSelected: (value: any) => void;
  setComponent: (value: string) => void;
};

export function useOutgoingLiveViewActions({
  getEventData,
  removeEvent,
  pushEventToLiveView,
  infoChatSelected,
  isVisibleDetail,
  setIsVisibleDetail,
  setInfoChatSelected,
  setComponent,
}: UseOutgoingLiveViewActionsParams) {
  const contactToDelete = useEvent("delete_contact");
  const selectedPrivateChat = useEvent("selected_private_chat");
  const sendMessage = useEvent("send_message");
  const sendFriendRequest = useEvent("send_friend_request");
  const statusFriendRequest = useEvent("update_status_request");
  const visibility = useEvent("toggle_detail_visibility");
  const addGroup = useEvent("add_group");
  const selectedGroupChat = useEvent("selected_group_chat");
  const groupToDelete = useEvent("delete_group");
  const showMyContactsInGroup = useEvent("get_my_contacts");
  const addContactToGroup = useEvent("add_member");
  const deleteMember = useEvent("delete_member");
  const setAdmin = useEvent("set_admin");
  const startCall = useEvent("start_private_call");
  const newIceCandidate = useEvent("new_ice_candidate");
  const newSdpOffer = useEvent("new_sdp_offer");
  const newAnswer = useEvent("new_answer");
  const endCall = useEvent("end_private_call");
  const loadOlderMessages = useEvent("load_older_messages");
  const installChatPlugin = useEvent("install_chat_plugin");
  const uninstallChatPlugin = useEvent("uninstall_chat_plugin");
  const getPomodoroState = useEvent("get_pomodoro_state");
  const updatePomodoroPluginConfig = useEvent("update_pomodoro_plugin_config");
  const startPomodoroTimer = useEvent("start_pomodoro_timer");
  const pausePomodoroTimer = useEvent("pause_pomodoro_timer");
  const resetPomodoroTimer = useEvent("reset_pomodoro_timer");
  const setPomodoroTimerMode = useEvent("set_pomodoro_timer_mode");
  const getKanbanBoard = useEvent("get_kanban_board");
  const addKanbanColumn = useEvent("add_kanban_column");
  const removeKanbanColumn = useEvent("remove_kanban_column");
  const addKanbanTask = useEvent("add_kanban_task");
  const moveKanbanTask = useEvent("move_kanban_task");
  const reorderKanbanTask = useEvent("reorder_kanban_task");
  const renameKanbanColumn = useEvent("rename_kanban_column");
  const renameKanbanTask = useEvent("rename_kanban_task");
  const deleteKanbanTask = useEvent("delete_kanban_task");
  const refreshConversations = useEvent("refresh_conversations");
  const groupDeleted = useEvent("group_deleted");
  const logout = useEvent("logout");

  useEffect(() => {
    if (contactToDelete) {
      pushEventToLiveView("action.delete_contact", contactToDelete);
      if (infoChatSelected?.contact_name === contactToDelete) {
        setComponent("");
        if (isVisibleDetail) {
          setIsVisibleDetail(false);
        }
        setInfoChatSelected({});
      }
      removeEvent("delete_contact");
    }
    if (selectedPrivateChat) {
      if (isVisibleDetail) {
        setIsVisibleDetail(false);
      }
      setInfoChatSelected(selectedPrivateChat);
      pushEventToLiveView("action.selected_private_chat", selectedPrivateChat);
      removeEvent("selected_private_chat");
    }
    if (sendMessage) {
      console.debug("[useOutgoingLiveViewActions] forwarding send_message", sendMessage);
      pushEventToLiveView("action.send_message", sendMessage);
      removeEvent("send_message");
    }
    if (sendFriendRequest) {
      pushEventToLiveView("action.send_friend_request", sendFriendRequest);
      removeEvent("send_friend_request");
    }
    if (statusFriendRequest) {
      pushEventToLiveView("action.update_status_request", statusFriendRequest);
      removeEvent("update_status_request");
    }
    if (visibility) {
      if (typeof visibility.is_visible === "boolean") {
        setIsVisibleDetail(visibility.is_visible);

        if (visibility.is_group && visibility.is_visible) {
          pushEventToLiveView("action.get_members", visibility);
        }
      }

      removeEvent("toggle_detail_visibility");
    }
    if (addGroup) {
      pushEventToLiveView("action.add_group", addGroup);
      removeEvent("add_group");
    }
    if (selectedGroupChat) {
      if (isVisibleDetail) {
        setIsVisibleDetail(false);
      }
      setInfoChatSelected(selectedGroupChat);
      pushEventToLiveView("action.selected_group_chat", selectedGroupChat);
      removeEvent("selected_group_chat");
    }
    if (groupToDelete) {
      pushEventToLiveView("action.delete_group", groupToDelete);
      if (infoChatSelected?.group_name === groupToDelete) {
        setComponent("");
        if (isVisibleDetail) {
          setIsVisibleDetail(false);
        }
        setInfoChatSelected({});
      }
      removeEvent("delete_group");
    }
    if (showMyContactsInGroup) {
      pushEventToLiveView("action.get_my_contacts", showMyContactsInGroup);
      removeEvent("get_my_contacts");
    }
    if (addContactToGroup) {
      pushEventToLiveView("action.add_member", addContactToGroup);
      removeEvent("add_member");
    }
    if (deleteMember) {
      pushEventToLiveView("action.delete_member", deleteMember);
      removeEvent("delete_member");
    }
    if (setAdmin) {
      pushEventToLiveView("action.set_admin", setAdmin);
      removeEvent("set_admin");
    }
    if (startCall) {
      pushEventToLiveView("action.start_private_call", startCall);
      removeEvent("start_private_call");
    }
    if (newIceCandidate) {
      pushEventToLiveView("action.new_ice_candidate", newIceCandidate);
      removeEvent("new_ice_candidate");
    }
    if (newSdpOffer) {
      pushEventToLiveView("action.new_sdp_offer", newSdpOffer);
      removeEvent("new_sdp_offer");
    }
    if (newAnswer) {
      pushEventToLiveView("action.new_answer", newAnswer);
      removeEvent("new_answer");
    }
    if (endCall) {
      pushEventToLiveView("action.end_private_call", endCall);
      removeEvent("end_private_call");
    }
    if (loadOlderMessages) {
      pushEventToLiveView("action.load_older_messages", loadOlderMessages);
      removeEvent("load_older_messages");
    }
    if (installChatPlugin) {
      pushEventToLiveView("action.install_chat_plugin", installChatPlugin);
      removeEvent("install_chat_plugin");
    }
    if (uninstallChatPlugin) {
      pushEventToLiveView("action.uninstall_chat_plugin", uninstallChatPlugin);
      removeEvent("uninstall_chat_plugin");
    }
    if (getPomodoroState) {
      pushEventToLiveView("action.get_pomodoro_state", getPomodoroState);
      removeEvent("get_pomodoro_state");
    }
    if (updatePomodoroPluginConfig) {
      pushEventToLiveView("action.update_pomodoro_plugin_config", updatePomodoroPluginConfig);
      removeEvent("update_pomodoro_plugin_config");
    }
    if (startPomodoroTimer) {
      pushEventToLiveView("action.start_pomodoro_timer", startPomodoroTimer);
      removeEvent("start_pomodoro_timer");
    }
    if (pausePomodoroTimer) {
      pushEventToLiveView("action.pause_pomodoro_timer", pausePomodoroTimer);
      removeEvent("pause_pomodoro_timer");
    }
    if (resetPomodoroTimer) {
      pushEventToLiveView("action.reset_pomodoro_timer", resetPomodoroTimer);
      removeEvent("reset_pomodoro_timer");
    }
    if (setPomodoroTimerMode) {
      pushEventToLiveView("action.set_pomodoro_timer_mode", setPomodoroTimerMode);
      removeEvent("set_pomodoro_timer_mode");
    }
    if (getKanbanBoard) {
      pushEventToLiveView("action.get_kanban_board", getKanbanBoard);
      removeEvent("get_kanban_board");
    }
    if (addKanbanColumn) {
      pushEventToLiveView("action.add_kanban_column", addKanbanColumn);
      removeEvent("add_kanban_column");
    }
    if (removeKanbanColumn) {
      pushEventToLiveView("action.remove_kanban_column", removeKanbanColumn);
      removeEvent("remove_kanban_column");
    }
    if (addKanbanTask) {
      pushEventToLiveView("action.add_kanban_task", addKanbanTask);
      removeEvent("add_kanban_task");
    }
    if (moveKanbanTask) {
      pushEventToLiveView("action.move_kanban_task", moveKanbanTask);
      removeEvent("move_kanban_task");
    }
    if (reorderKanbanTask) {
      pushEventToLiveView("action.reorder_kanban_task", reorderKanbanTask);
      removeEvent("reorder_kanban_task");
    }
    if (renameKanbanColumn) {
      pushEventToLiveView("action.rename_kanban_column", renameKanbanColumn);
      removeEvent("rename_kanban_column");
    }
    if (renameKanbanTask) {
      pushEventToLiveView("action.rename_kanban_task", renameKanbanTask);
      removeEvent("rename_kanban_task");
    }
    if (deleteKanbanTask) {
      pushEventToLiveView("action.delete_kanban_task", deleteKanbanTask);
      removeEvent("delete_kanban_task");
    }
    if (refreshConversations) {
      pushEventToLiveView("action.get_list_contact", {});
      removeEvent("refresh_conversations");
    }
    if (groupDeleted) {
      const isCurrentSelectedGroup =
        infoChatSelected?.group_name && groupDeleted?.group_name
          ? infoChatSelected.group_name === groupDeleted.group_name
          : false;

      if (isCurrentSelectedGroup) {
        setComponent("");
        if (isVisibleDetail) {
          setIsVisibleDetail(false);
        }
        setInfoChatSelected({});
      }

      removeEvent("group_deleted");
    }
    if (logout) {
      clearAllTimers();
      clearRequestedConfigs();
      clearAllPomodoroNotifications();
      pushEventToLiveView("action.logout", {});
      removeEvent("logout");
    }
  }, [
    contactToDelete,
    selectedPrivateChat,
    sendMessage,
    sendFriendRequest,
    statusFriendRequest,
    visibility,
    addGroup,
    selectedGroupChat,
    groupToDelete,
    showMyContactsInGroup,
    addContactToGroup,
    deleteMember,
    setAdmin,
    startCall,
    newIceCandidate,
    newSdpOffer,
    newAnswer,
    endCall,
    loadOlderMessages,
    installChatPlugin,
    uninstallChatPlugin,
    getPomodoroState,
    updatePomodoroPluginConfig,
    startPomodoroTimer,
    pausePomodoroTimer,
    resetPomodoroTimer,
    setPomodoroTimerMode,
    getKanbanBoard,
    addKanbanColumn,
    removeKanbanColumn,
    addKanbanTask,
    moveKanbanTask,
    reorderKanbanTask,
    renameKanbanColumn,
    renameKanbanTask,
    deleteKanbanTask,
    refreshConversations,
    groupDeleted,
    logout,
    pushEventToLiveView,
    infoChatSelected,
    isVisibleDetail,
    setIsVisibleDetail,
    setInfoChatSelected,
    setComponent,
    removeEvent,
  ]);
}
