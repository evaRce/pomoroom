import React, { useState, useEffect } from "react";
import ChatPanel from "./chat_panel/ChatPanel";
import ChatDetailPanel from "./info_panel/ChatDetailPanel";
import BackGround from "./chat_panel/BackGround";
import { useEventContext } from "./EventContext";
import RequestReceived from "./contact_requests/RequestReceived";
import RequestSend from "./contact_requests/RequestSend";
import RejectedRequestSend from "./contact_requests/RejectedRequestSend";
import RejectedRequestReceived from "./contact_requests/RejectedRequestReceived";
import ConversationSidebar from "./conversation_sidebar/ConversationSidebar";
export interface ChatRoomProps {
  eventName: string;
  eventData: any;
  pushEventToLiveView(event: string, payload: object): any;
}

export const ChatRoom: React.FC<ChatRoomProps> = (props: ChatRoomProps) => {
  const { eventName, eventData, pushEventToLiveView } = props;
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [component, setComponent] = useState("");
  const [imageNumber, setImageNumber] = useState(1);
  const [userName, setUserName] = useState("");
  const [isVisibleDetail, setIsVisibleDetail] = useState(false);
  const [infoChatSelected, setInfoChatSelected] = useState({});

  useEffect(() => {
    const randomImageNumber = Math.floor(Math.random() * 5) + 1;
    setImageNumber(randomImageNumber);
    pushEventToLiveView("action.get_user_info", {});
  }, []);

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
  }, [addEvent]);

  useEffect(() => {
    if (eventName === "show_user_info" && eventData.nickname) {
      setUserName(eventData.nickname);
      addEvent(eventName, eventData);
    }
  }, [eventData.nickname]);

  useEffect(() => {
    if (eventName === "add_contact_to_list" && eventData.contact_data) {
      addEvent(eventName, eventData);
    }
  }, [eventData.contact_data, eventData.request]);

  useEffect(() => {
    if (eventName === "add_group_to_list" && eventData.group_data) {
      addEvent(eventName, eventData);
    }
  }, [eventData.group_data, eventData.status]);

  useEffect(() => {
    if (eventName === "error_adding_contact" && eventData.error) {
      addEvent(eventName, eventData.error);
    }
  }, [eventData.error]);

  useEffect(() => {
    if (eventName === "show_list_contact" && eventData.all_contact_list) {
      addEvent(eventName, eventData.all_contact_list);
    }
  }, [eventData.all_contact_list]);

  useEffect(() => {
    if (eventName === "open_private_chat") {
      console.log("OPEN PRIVATE CHAT LLEGO");
      addEvent(eventName, eventData);
      addEvent("show_list_messages", eventData);
      if (isVisibleDetail) {
        if (userName === eventData.from_user_data.nickname) {
          addEvent("show_detail", {
            chat_name: eventData.to_user_data.nickname,
            image: eventData.to_user_data.image_profile,
            is_group: false,
          });
        } else {
          addEvent("show_detail", {
            chat_name: eventData.from_user_data.nickname,
            image: eventData.from_user_data.image_profile,
            is_group: false,
          });
        }
      }
      setComponent("ChatPanel");
    }
  }, [eventData.from_user_data, eventData.to_user_data, eventData.messages]);

  useEffect(() => {
    if (eventName === "show_message_to_send") {
      addEvent(eventName, eventData);
    }
  }, [eventData.message]);

  useEffect(() => {
    if (
      eventName === "open_chat_request_send" &&
      userName === eventData.request.from_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestSend");
    }
    if (
      eventName === "open_chat_request_received" &&
      userName === eventData.request.to_user
    ) {
      addEvent(eventName, eventData.request);
      setIsVisibleDetail(false);
      setComponent("RequestReceived");
    }
  }, [eventData.request]);

  useEffect(() => {
    if (
      eventName === "open_rejected_request_send" &&
      userName === eventData.rejected_request.to_user
    ) {
      setIsVisibleDetail(false);
      addEvent(eventName, eventData.rejected_request);
      addEvent("update_contact_status_to_rejected", {
        request: eventData.rejected_request,
        new_status: eventData.rejected_request.status,
      });
      if (
        infoChatSelected?.contact_name === eventData?.rejected_request.from_user
      ) {
        setComponent("RejectedRequestSend");
      }
    }
    if (
      eventName === "open_rejected_request_received" &&
      userName === eventData.rejected_request.from_user
    ) {
      setIsVisibleDetail(false);
      addEvent(eventName, eventData.rejected_request);
      addEvent("update_contact_status_to_rejected", {
        request: eventData.rejected_request,
        new_status: eventData.rejected_request.status,
      });
      if (
        infoChatSelected?.contact_name === eventData?.rejected_request.to_user
      ) {
        setComponent("RejectedRequestReceived");
      }
    }
  }, [eventData.rejected_request]);

  useEffect(() => {
    if (eventName === "open_group_chat" && eventData.group_data) {
      addEvent(eventName, eventData);
      addEvent("check_admin", { is_admin: eventData.is_admin });
      addEvent("show_list_messages", eventData);
      if (isVisibleDetail) {
        addEvent("show_detail", {
          chat_name: eventData.group_data.name,
          image: eventData.group_data.image,
          is_group: true,
        });
        addEvent("show_members", { members: eventData.members_data });
      }
      setComponent("ChatPanel");
    }
  }, [
    eventData.is_admin,
    eventData.group_data,
    eventData.messages,
    eventData.members_data,
  ]);

  useEffect(() => {
    if (eventName === "show_my_contacts" && eventData.contact_list) {
      addEvent(eventName, eventData.contact_list);
    }
  }, [eventData.contact_list]);

  useEffect(() => {
    if (eventName === "show_members") {
      addEvent(eventName, { members: eventData.members_data });
    }
  }, [eventData.members_data]);

  useEffect(() => {
    if (eventName === "update_show_my_contacts_and_members") {
      addEvent("show_my_contacts", eventData.contact_list);
      addEvent("show_members", { members: eventData.members_data });
    }
  }, [eventData.contact_list, eventData.members_data]);

  useEffect(() => {
    if (eventName === "update_contact_status_to_accepted") {
      addEvent(eventName, eventData);
      setComponent("");
      addEvent("deselect_contact", {
        from_user: eventData.request.from_user,
        to_user: eventData.request.to_user,
      });
    }
  }, [eventData.request, eventData.new_status]);

  useEffect(() => {
    if (eventName === "connected_users") {
      addEvent("connected_users", eventData.connected_users);
    }
  }, [eventData.connected_users]);

  useEffect(() => {
    if (eventName === "offer_requests") {
      console.log("[", userName, "]OFFER REq llego");
      addEvent(eventName, eventData.offer_requests);
    }
  }, [eventData.offer_requests]);

  useEffect(() => {
    if (eventName === "receive_ice_candidate_offers") {
      console.log("[", userName, "] receive_ice_candidate_offers llego");
      addEvent(eventName, eventData.ice_candidate_offers);
    }
  }, [eventData.ice_candidate_offers]);

  useEffect(() => {
    if (eventName === "receive_sdp_offers") {
      console.log("[", userName, "] receive_sdp_offers llego");
      addEvent(eventName, eventData.sdp_offer);
    }
  }, [eventData.sdp_offer]);

  useEffect(() => {
    if (eventName === "receive_answers") {
      console.log("[", userName, "] receive_answers  llego");
      addEvent(eventName, eventData.answers);
    }
  }, [eventData.answers]);

  return (
    <div className="flex h-screen w-screen min-h-screen md:min-h-48 overflow-x-hidden">
      <ConversationSidebar />
      {component === "ChatPanel" && <ChatPanel />}
      {component === "RequestSend" && <RequestSend imageNumber={imageNumber} />}
      {component === "RequestReceived" && (
        <RequestReceived imageNumber={imageNumber} />
      )}
      {component === "RejectedRequestSend" && (
        <RejectedRequestSend imageNumber={imageNumber} />
      )}
      {component === "RejectedRequestReceived" && (
        <RejectedRequestReceived imageNumber={imageNumber} />
      )}
      {component === "" && <BackGround imageNumber={imageNumber} />}
      {isVisibleDetail === true && <ChatDetailPanel />}
    </div>
  );
};
