defmodule PomoroomWeb.ChatLive.ChatRoom.Groups do
  import Phoenix.Component, only: [assign: 3]
  import PomoroomWeb.ChatLive.ChatRoom.ReactEvent
  import PomoroomWeb.Gettext

  alias Phoenix.PubSub
  alias Pomoroom.Chats.Runtime.{ChatServer, Runtime}
  alias Pomoroom.FriendRequests
  alias Pomoroom.GroupChats
  alias Pomoroom.Users

  def handle_add_group(name_group, user, socket) do
    case GroupChats.create_group_chat(user.nickname, name_group) do
      {:ok, group_chat} ->
        Runtime.ensure_chat_server_exists(group_chat.chat_id)
        PubSub.subscribe(Pomoroom.PubSub, "chat:#{group_chat.chat_id}")
        ChatServer.join_chat(group_chat.chat_id)

        event_data = %{is_group: true, group_data: group_chat, status: "accepted"}
        notify_react(socket, "add_group_to_list", event_data)

      {:error, reason} ->
        notify_react(socket, "error_adding_contact", reason)
    end
  end

  def handle_delete_group(group_name, user, socket) do
    case GroupChats.get_by("name", group_name) do
      {:ok, group_chat} ->
        GroupChats.delete(group_name, user.nickname)
        PubSub.unsubscribe(Pomoroom.PubSub, "chat:#{group_chat.chat_id}")
        {:noreply, socket}

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_get_my_contacts(group_name, user, socket) do
    case get_contact_list_for_group(group_name, user) do
      {:ok, contact_list} ->
        notify_react(socket, "show_my_contacts", %{contact_list: contact_list})
    end
  end

  def handle_get_members(group_name, socket) do
    case GroupChats.get_members(group_name) do
      {:ok, members_data} ->
        notify_react(socket, "show_members", %{members_data: members_data})

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_add_member(group_name, new_member, user, socket) do
    case GroupChats.add_member(group_name, user.nickname, new_member) do
      {:error, reason} ->
        notify_react(socket, "error_managing_group_member", reason)

      {:ok, _result} ->
        payload =
          case GroupChats.get_by("name", group_name) do
            {:ok, group_chat} -> %{group_name: group_name, chat_id: group_chat.chat_id}
            {:error, _reason} -> %{group_name: group_name}
          end

        PubSub.broadcast(
          Pomoroom.PubSub,
          "user:#{new_member}",
          {:new_group_member_added, payload}
        )

        handle_member_update(group_name, user, socket)
    end
  end

  def handle_delete_member(group_name, member_name, user, socket) do
    case GroupChats.delete_member(group_name, user.nickname, member_name) do
      {:ok, %{chat_deleted: true, chat_id: chat_id}} ->
        socket =
          if socket.assigns[:chat_id] == chat_id do
            socket
            |> assign(:chat_id, nil)
            |> assign(:current_group_joined_at, nil)
            |> assign(:current_group_removed_at, nil)
          else
            socket
          end

        socket =
          if chat_id do
            PubSub.unsubscribe(Pomoroom.PubSub, "chat:#{chat_id}")
            socket
          else
            socket
          end

        notify_react(socket, "group_deleted", %{chat_id: chat_id, group_name: group_name})

      {:ok, %{chat_id: chat_id, group_name: removed_group_name, removed_at: removed_at}} ->
        PubSub.broadcast(
          Pomoroom.PubSub,
          "user:#{member_name}",
          {:group_member_removed,
           %{chat_id: chat_id, group_name: removed_group_name, removed_at: removed_at}}
        )

        handle_member_update(group_name, user, socket)

      {:error, reason} ->
        notify_react(socket, "error_managing_group_member", reason)
    end
  end

  def handle_set_admin(group_name, member_name, operation, user, socket) do
    result =
      case operation do
        "add" -> GroupChats.add_admin(group_name, user.nickname, member_name)
        "delete" -> GroupChats.delete_admin(group_name, user.nickname, member_name)
      end

    case result do
      {:ok, _message} ->
        case GroupChats.get_by("name", group_name) do
          {:ok, group_chat} ->
            payload = %{chat_id: group_chat.chat_id, group_name: group_name}

            group_chat
            |> get_active_member_nicknames()
            |> Enum.each(fn nickname ->
              PubSub.broadcast(
                Pomoroom.PubSub,
                "user:#{nickname}",
                {:group_admin_updated, payload}
              )
            end)

            {:noreply, socket}

          {:error, _reason} ->
            {:noreply, socket}
        end

      {:error, reason} ->
        notify_react(socket, "error_managing_group_member", reason)
    end
  end

  def handle_group_admin_updated(payload, socket) do
    chat_id = Map.get(payload, :chat_id)
    group_name = Map.get(payload, :group_name)
    current_user_nickname = socket.assigns.user_info.nickname

    is_admin =
      case GroupChats.is_admin?(group_name, current_user_nickname) do
        true -> true
        _ -> false
      end

    group_admin_updated_data = %{chat_id: chat_id, group_name: group_name, is_admin: is_admin}

    socket =
      socket
      |> push_react("check_admin", %{is_admin: is_admin})
      |> push_react("group_admin_updated", group_admin_updated_data)

    if socket.assigns[:chat_id] == chat_id do
      case GroupChats.get_members(group_name) do
        {:ok, members_data} ->
          notify_react(socket, "show_members", %{members_data: members_data})

        {:error, _reason} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_new_group_member_added(%{chat_id: chat_id} = payload, socket) do
    current_user_nickname = socket.assigns.user_info.nickname

    group_name =
      Map.get(payload, :group_name) ||
        case GroupChats.get_by("chat_id", chat_id) do
          {:ok, group_chat} -> group_chat.name
          {:error, _reason} -> nil
        end

    is_admin = GroupChats.is_admin?(group_name, current_user_nickname)

    added_message =
      if group_name do
        gettext("Has sido añadido al grupo %{group_name}", group_name: group_name)
      else
        gettext("Has sido añadido al grupo")
      end

    socket =
      socket
      |> ensure_group_chat_subscription(chat_id)
      |> maybe_reset_removed_state(chat_id)

    event_data = %{
      chat_id: chat_id,
      group_name: group_name,
      is_admin: is_admin,
      message: added_message
    }

    notify_react(socket, "group_member_added", event_data)
  end

  def handle_new_group_member_added(%{group_name: group_name}, socket) do
    current_user_nickname = socket.assigns.user_info.nickname

    case GroupChats.get_by("name", group_name) do
      {:ok, group_chat} ->
        is_admin = GroupChats.is_admin?(group_name, current_user_nickname)

        socket =
          socket
          |> ensure_group_chat_subscription(group_chat.chat_id)
          |> maybe_reset_removed_state(group_chat.chat_id)

        event_data = %{
          chat_id: group_chat.chat_id,
          group_name: group_name,
          is_admin: is_admin,
          message: gettext("Has sido añadido al grupo %{group_name}", group_name: group_name)
        }

        notify_react(socket, "group_member_added", event_data)

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_group_member_removed(payload, socket) do
    chat_id = Map.get(payload, :chat_id)
    group_name = Map.get(payload, :group_name)
    removed_at = Map.get(payload, :removed_at)

    socket =
      if socket.assigns[:chat_id] == chat_id do
        assign(socket, :current_group_removed_at, removed_at)
      else
        socket
      end

    event_data = %{
      chat_id: chat_id,
      group_name: group_name,
      removed_at: removed_at,
      disable_send: true
    }

    notify_react(socket, "group_member_removed", event_data)
  end

  defp get_contacts_for_group(contacts, user_nickname, group_name) do
    case GroupChats.get_by("name", group_name) do
      {:ok, group_chat} ->
        active_members_set =
          (group_chat.members || [])
          |> Enum.map(fn member ->
            cond do
              is_map(member) and is_nil(member["removed_at"] || member[:removed_at]) ->
                member["user_id"] || member[:user_id]

              is_binary(member) ->
                member

              true ->
                nil
            end
          end)
          |> Enum.reject(&is_nil/1)
          |> MapSet.new()

        Enum.map(contacts, fn contact ->
          {to_user, from_user} =
            FriendRequests.determine_friend_request_users(contact.nickname, user_nickname)

          case FriendRequests.get(to_user, from_user) do
            {:ok, request} ->
              if request.status == "accepted" do
                %{
                  is_group: false,
                  contact_data: contact,
                  request: request
                }
              else
                nil
              end

            _ ->
              nil
          end
        end)
        |> Enum.reject(&is_nil/1)
        |> Enum.reject(fn %{contact_data: contact} ->
          MapSet.member?(active_members_set, contact.nickname)
        end)

      {:error, _reason} ->
        []
    end
  end

  defp handle_member_update(group_name, user, socket) do
    case get_contact_list_for_group(group_name, user) do
      {:ok, contact_list} ->
        case GroupChats.get_members(group_name) do
          {:ok, members_data} ->
            event_data = %{contact_list: contact_list, members_data: members_data}
            notify_react(socket, "update_show_my_contacts_and_members", event_data)

          {:error, _reason} ->
            {:noreply, socket}
        end
    end
  end

  defp ensure_group_chat_subscription(socket, chat_id) do
    subscribed_chat_ids = Map.get(socket.assigns, :subscribed_chat_ids, MapSet.new())

    if MapSet.member?(subscribed_chat_ids, chat_id) do
      socket
    else
      Runtime.ensure_chat_server_exists(chat_id)
      ChatServer.join_chat(chat_id)
      PubSub.subscribe(Pomoroom.PubSub, "chat:#{chat_id}")
      assign(socket, :subscribed_chat_ids, MapSet.put(subscribed_chat_ids, chat_id))
    end
  end

  defp maybe_reset_removed_state(socket, chat_id) do
    if socket.assigns[:chat_id] == chat_id do
      assign(socket, :current_group_removed_at, nil)
    else
      socket
    end
  end

  defp get_active_member_nicknames(group_chat) do
    (group_chat.members || [])
    |> Enum.map(fn member ->
      cond do
        is_map(member) and is_nil(member["removed_at"] || member[:removed_at]) ->
          member["user_id"] || member[:user_id]

        is_binary(member) ->
          member

        true ->
          nil
      end
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp get_contact_list_for_group(group_name, user) do
    case Users.get_contacts(user.nickname) do
      {:ok, []} ->
        {:ok, []}

      {:ok, contacts} ->
        {:ok, get_contacts_for_group(contacts, user.nickname, group_name)}
    end
  end
end
