import { useEffect } from "react";
import { useEvent } from "../../components/chat_room/EventContext";
import { clearAllTimers, clearRequestedConfigs } from "../../components/chat_room/pomodoro_timer/pomodoroTimerStore";
import { clearAllPomodoroNotifications } from "../../components/chat_room/pomodoro_timer/pomodoroNotificationStore";

type UseContactsAndGroupsOutgoingActionsParams = {
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
  infoChatSelected: any;
  isVisibleDetail: boolean;
  setIsVisibleDetail: (value: boolean) => void;
  setInfoChatSelected: (value: any) => void;
  setComponent: (value: string) => void;
};

export function useContactsAndGroupsOutgoingActions({
  removeEvent,
  pushEventToLiveView,
  infoChatSelected,
  isVisibleDetail,
  setIsVisibleDetail,
  setInfoChatSelected,
  setComponent,
}: UseContactsAndGroupsOutgoingActionsParams) {
  const contactToDelete = useEvent("delete_contact");
  const selectedPrivateChat = useEvent("selected_private_chat");
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
