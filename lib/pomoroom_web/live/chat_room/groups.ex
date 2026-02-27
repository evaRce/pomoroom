defmodule PomoroomWeb.ChatLive.ChatRoom.Groups do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Phoenix.PubSub
  alias Pomoroom.ChatRoom.ChatServer
  alias Pomoroom.FriendRequests
  alias Pomoroom.GroupChats
  alias Pomoroom.Users
  alias PomoroomWeb.ChatLive.ChatRoom.Runtime

  def handle_add_group(name_group, user, socket) do
    case GroupChats.create_group_chat(user.nickname, name_group) do
      {:ok, group_chat} ->
        Runtime.ensure_chat_server_exists(group_chat.chat_id)
        PubSub.subscribe(Pomoroom.PubSub, "chat:#{group_chat.chat_id}")
        ChatServer.join_chat(group_chat.chat_id)

        payload = %{
          event_name: "add_group_to_list",
          event_data: %{
            is_group: true,
            group_data: group_chat,
            status: "accepted"
          }
        }

        {:noreply, push_event(socket, "react", payload)}

      {:error, reason} ->
        payload = %{event_name: "error_adding_contact", event_data: reason}
        {:noreply, push_event(socket, "react", payload)}
    end
  end

  def handle_delete_group(group_name, user, socket) do
    {:ok, group_chat} = GroupChats.get_by("name", group_name)
    GroupChats.delete(group_name, user.nickname)
    PubSub.unsubscribe(Pomoroom.PubSub, "chat:#{group_chat.chat_id}")
    {:noreply, socket}
  end

  def handle_get_my_contacts(group_name, user, socket) do
    case Users.get_contacts(user.nickname) do
      {:ok, []} ->
        {:noreply, socket}

      {:ok, contacts} ->
        contact_list = get_contacts_for_group(contacts, user.nickname, group_name)

        payload = %{
          event_name: "show_my_contacts",
          event_data: %{contact_list: contact_list}
        }

        {:noreply, push_event(socket, "react", payload)}
    end
  end

  def handle_get_members(group_name, socket) do
    case GroupChats.get_members(group_name) do
      {:ok, members_data} ->
        payload = %{
          event_name: "show_members",
          event_data: %{members_data: members_data}
        }

        {:noreply, push_event(socket, "react", payload)}

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_add_member(group_name, new_member, user, socket) do
    case GroupChats.add_member(group_name, user.nickname, new_member) do
      {:error, _reason} ->
        {:noreply, socket}

      {:ok, _result} ->
        handle_member_update(group_name, user, socket)
    end
  end

  def handle_delete_member(group_name, member_name, user, socket) do
    GroupChats.delete_member(group_name, user.nickname, member_name)
    handle_member_update(group_name, user, socket)
  end

  def handle_set_admin(group_name, member_name, operation, user, socket) do
    case operation do
      "add" ->
        GroupChats.add_admin(group_name, user.nickname, member_name)
        {:noreply, socket}

      "delete" ->
        GroupChats.delete_admin(group_name, user.nickname, member_name)
        {:noreply, socket}
    end
  end

  defp get_contacts_for_group(contacts, user_nickname, group_name) do
    {:ok, group_chat} = GroupChats.get_by("name", group_name)

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
      # Filtra los contactos que ya están en el grupo
      Enum.any?(group_chat.members, fn member ->
        member == contact.nickname
      end)
    end)
  end

  defp handle_member_update(group_name, user, socket) do
    case Users.get_contacts(user.nickname) do
      {:ok, []} ->
        {:noreply, socket}

      {:ok, contacts} ->
        case GroupChats.get_members(group_name) do
          {:ok, members_data} ->
            contact_list = get_contacts_for_group(contacts, user.nickname, group_name)

            payload = %{
              event_name: "update_show_my_contacts_and_members",
              event_data: %{contact_list: contact_list, members_data: members_data}
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            {:noreply, socket}
        end
    end
  end
end
