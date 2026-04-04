import { useEffect } from "react";

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
  useEffect(() => {
    const contactToDelete = getEventData("delete_contact");
    const selectedPrivateChat = getEventData("selected_private_chat");
    const sendMessage = getEventData("send_message");
    const sendFriendRequest = getEventData("send_friend_request");
    const statusFriendRequest = getEventData("update_status_request");
    const visibility = getEventData("toggle_detail_visibility");
    const addGroup = getEventData("add_group");
    const selectedGroupChat = getEventData("selected_group_chat");
    const groupToDelete = getEventData("delete_group");
    const showMyContactsInGroup = getEventData("get_my_contacts");
    const addContactToGroup = getEventData("add_member");
    const deleteMember = getEventData("delete_member");
    const setAdmin = getEventData("set_admin");
    const startCall = getEventData("start_private_call");
    const newIceCandidate = getEventData("new_ice_candidate");
    const newSdpOffer = getEventData("new_sdp_offer");
    const newAnswer = getEventData("new_answer");
    const endCall = getEventData("end_private_call");
    const loadOlderMessages = getEventData("load_older_messages");
    const refreshConversations = getEventData("refresh_conversations");
    const groupDeleted = getEventData("group_deleted");

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
      setIsVisibleDetail(visibility.is_visible);
      if (visibility.is_group) {
        pushEventToLiveView("action.get_members", visibility);
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
  }, [
    getEventData,
    removeEvent,
    pushEventToLiveView,
    infoChatSelected,
    isVisibleDetail,
    setIsVisibleDetail,
    setInfoChatSelected,
    setComponent,
  ]);
}
