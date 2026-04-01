defmodule PomoroomWeb.ChatLive.ChatRoom do
  alias PomoroomWeb.ChatLive.ChatRoom.Calls
  alias PomoroomWeb.ChatLive.ChatRoom.Chats
  alias PomoroomWeb.ChatLive.ChatRoom.Contacts
  alias PomoroomWeb.ChatLive.ChatRoom.FriendRequests
  alias PomoroomWeb.ChatLive.ChatRoom.Groups
  alias PomoroomWeb.ChatLive.ChatRoom.Runtime
  alias Phoenix.Socket.Broadcast
  alias Phoenix.PubSub
  alias Pomoroom.ChatRoom.ChatServer
  alias Pomoroom.Users

  use PomoroomWeb, :live_view

  def mount(_params, session, socket) do
    socket =
      socket
      |> PhoenixLiveSession.maybe_subscribe(session)
      |> put_session_assigns(session)

    subscribed_chat_ids = MapSet.new()

    if connected?(socket) do
      user_nickname = socket.assigns.user_info.nickname
      PubSub.subscribe(Pomoroom.PubSub, "friend_request:#{user_nickname}")
      PubSub.subscribe(Pomoroom.PubSub, "user:#{user_nickname}")
      all_chats_id = Users.get_all_my_chats_id(user_nickname)

      Enum.each(Enum.uniq(all_chats_id), fn chat_id ->
        Runtime.ensure_chat_server_exists(chat_id)
        ChatServer.join_chat(chat_id)
        PubSub.subscribe(Pomoroom.PubSub, "chat:#{chat_id}")
      end)

      subscribed_chat_ids = MapSet.new(all_chats_id)
      socket = assign(socket, :subscribed_chat_ids, subscribed_chat_ids)
      socket = Calls.reset_call_state(socket)

      {:ok, socket, layout: false}
    else
      socket =
        socket
        |> assign(:subscribed_chat_ids, subscribed_chat_ids)
        |> Calls.reset_call_state()

      {:ok, socket, layout: false}
    end
  end

  def handle_info({:new_message, args}, socket) do
    current_chat_id = Map.get(socket.assigns, :chat_id)
    message_chat_id = get_in(args, [:data, :chat_id]) || get_in(args, ["data", "chat_id"])

    if not is_nil(current_chat_id) and current_chat_id == message_chat_id do
      Chats.handle_new_message_info(args, socket)
    else
      {:noreply, socket}
    end
  end

  def handle_info({:new_group_member_added, payload}, socket) do
    Groups.handle_new_group_member_added(payload, socket)
  end

  # Las request_offers solo le llegan al que INICIO la llamada
  def handle_info({:request_offers, %{from_user: request_from_user}}, socket) do
    Calls.handle_request_offers(socket, request_from_user)
  end

  def handle_info({:friend_request_sent, payload}, socket) do
    FriendRequests.handle_friend_request_sent(payload, socket)
  end

  def handle_info(
        {:friend_request_change_status,
         %{
           event_name: "update_contact_status_to_accepted",
           event_data: %{request: _request, new_status: "accepted"}
         } = payload, chat_id},
        socket
      ) do
    FriendRequests.handle_friend_request_accepted(payload, chat_id, socket)
  end

  def handle_info(
        {:friend_request_change_status,
         %{
           event_name: "open_rejected_request_received",
           event_data: %{rejected_request: %{to_user: _to_user, status: "rejected"}}
         } = payload},
        socket
      ) do
    FriendRequests.handle_friend_request_rejected(payload, socket)
  end

  def handle_info(
        %Broadcast{topic: topic, event: "presence_diff", payload: _payload},
        %{assigns: %{user_info: %{nickname: nickname}, chat_id: chat_id}} = socket
      ) do
    Calls.handle_presence_diff(socket, topic, nickname, chat_id)
  end

  def handle_info(
        {:new_ice_candidate,
         %{"candidate" => _candidate, "from_user" => _from_user, "to_user" => _to_user} = payload},
        socket
      ) do
    Calls.handle_new_ice_candidate_info(socket, payload)
  end

  def handle_info(
        {:new_sdp_offer,
         %{
           "description" => %{"sdp" => _sdp, "type" => "offer"},
           "from_user" => _from_user,
           "to_user" => _to_user
         } = payload},
        socket
      ) do
    Calls.handle_new_sdp_offer_info(socket, payload)
  end

  def handle_info(
        {:new_answer,
         %{
           "description" => %{"sdp" => _sdp, "type" => "answer"},
           "from_user" => _from_user,
           "to_user" => _to_user
         } = payload},
        socket
      ) do
    Calls.handle_new_answer_info(socket, payload)
  end

  def handle_event("action.get_user_info", _args, %{assigns: %{user_info: user}} = socket) do
    payload = %{event_name: "show_user_info", event_data: user}
    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_event("action.get_list_contact", _args, %{assigns: %{user_info: user}} = socket) do
    Contacts.handle_list_contacts(user, socket)
  end

  def handle_event("action.delete_contact", contact_name, %{assigns: %{user_info: user}} = socket) do
    Contacts.handle_delete_contact(contact_name, user, socket)
  end

  def handle_event(
        "action.selected_private_chat",
        %{"contact_name" => contact_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    Chats.handle_selected_private_chat(contact_name, user, socket)
  end

  def handle_event(
        "action.selected_group_chat",
        %{"group_name" => group_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    Chats.handle_selected_group_chat(group_name, user, socket)
  end

  def handle_event(
        "action.update_status_request",
        %{"status" => status, "contact_name" => to_user_name, "from_user_name" => from_user_name},
        %{assigns: %{user_info: %{nickname: user_nickname}}} = socket
      ) do
    FriendRequests.handle_update_status_request(
      status,
      to_user_name,
      from_user_name,
      user_nickname,
      socket
    )
  end

  def handle_event(
        "action.send_message",
        %{"message" => message, "to_user" => to_user_arg},
        %{assigns: %{user_info: user}} = socket
      ) do
    Chats.handle_send_private_message(message, to_user_arg, user, socket)
  end

  def handle_event(
        "action.send_message",
        %{"message" => message, "to_group_name" => to_group_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    Chats.handle_send_group_message(message, to_group_name, user, socket)
  end

  def handle_event(
        "action.load_older_messages",
        %{
          "chat_id" => chat_id,
          "before_inserted_at" => before_inserted_at,
          "before_db_id" => before_db_id
        },
        socket
      ) do
    joined_at =
      if socket.assigns[:chat_id] == chat_id do
        socket.assigns[:current_group_joined_at]
      else
        nil
      end

    Chats.handle_load_older_messages(chat_id, before_inserted_at, before_db_id, joined_at, socket)
  end

  def handle_event(
        "action.load_older_messages",
        %{"chat_id" => chat_id, "before_inserted_at" => before_inserted_at},
        socket
      ) do
    joined_at =
      if socket.assigns[:chat_id] == chat_id do
        socket.assigns[:current_group_joined_at]
      else
        nil
      end

    Chats.handle_load_older_messages(chat_id, before_inserted_at, nil, joined_at, socket)
  end

  def handle_event(
        "action.send_friend_request",
        %{"to_user" => to_user_arg},
        %{assigns: %{user_info: user}} = socket
      ) do
    FriendRequests.handle_send_friend_request(to_user_arg, user, socket)
  end

  def handle_event(
        "action.add_group",
        %{"name" => name_group},
        %{assigns: %{user_info: user}} = socket
      ) do
    Groups.handle_add_group(name_group, user, socket)
  end

  def handle_event("action.delete_group", group_name, %{assigns: %{user_info: user}} = socket) do
    Groups.handle_delete_group(group_name, user, socket)
  end

  def handle_event(
        "action.get_my_contacts",
        %{"group_name" => group_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    Groups.handle_get_my_contacts(group_name, user, socket)
  end

  def handle_event(
        "action.get_members",
        %{"group_name" => group_name, "is_group" => _is_group, "is_visible" => _is_visible},
        socket
      ) do
    Groups.handle_get_members(group_name, socket)
  end

  def handle_event(
        "action.add_member",
        %{"group_name" => group_name, "new_member" => new_member},
        %{assigns: %{user_info: user}} = socket
      ) do
    Groups.handle_add_member(group_name, new_member, user, socket)
  end

  def handle_event(
        "action.delete_member",
        %{"group_name" => group_name, "member_name" => member_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    Groups.handle_delete_member(group_name, member_name, user, socket)
  end

  def handle_event(
        "action.set_admin",
        %{"group_name" => group_name, "member_name" => member_name, "operation" => operation},
        %{assigns: %{user_info: user}} = socket
      ) do
    Groups.handle_set_admin(group_name, member_name, operation, user, socket)
  end

  # Start call,
  def handle_event(
        "action.start_private_call",
        %{"contact_name" => to_user},
        %{assigns: %{user_info: from_user, chat_id: chat_id}} = socket
      ) do
    Calls.handle_start_private_call(socket, to_user, from_user, chat_id)
  end

  def handle_event(
        "action.new_ice_candidate",
        %{"candidate" => _candidate, "to_user" => to_user} = payload,
        %{assigns: %{user_info: from_user, chat_id: chat_id}} = socket
      ) do
    Calls.handle_new_ice_candidate_event(socket, payload, to_user, from_user, chat_id)
  end

  def handle_event(
        "action.new_sdp_offer",
        %{"description" => _description, "to_user" => to_user} = payload,
        %{assigns: %{user_info: from_user, chat_id: chat_id}} = socket
      ) do
    Calls.handle_new_sdp_offer_event(socket, payload, to_user, from_user, chat_id)
  end

  def handle_event(
        "action.new_answer",
        %{"description" => _description, "to_user" => to_user} = payload,
        %{assigns: %{user_info: from_user, chat_id: chat_id}} = socket
      ) do
    Calls.handle_new_answer_event(socket, payload, to_user, from_user, chat_id)
  end

  def handle_event(
        "action.end_private_call",
        _payload,
        %{assigns: %{user_info: from_user, chat_id: chat_id}} = socket
      ) do
    Calls.handle_end_private_call(socket, from_user, chat_id)
  end

  def put_session_assigns(socket, session) do
    socket
    |> assign(:user_info, Map.get(session, "user_info", %{}))
  end

  def get_user_pid(user_name) do
    case Registry.lookup(Registry.Chat, user_name) do
      [{pid, _value}] -> {:ok, pid}
      [] -> {:error, :user_not_found}
    end
  end
end
