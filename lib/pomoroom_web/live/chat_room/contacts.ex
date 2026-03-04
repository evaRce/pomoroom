defmodule PomoroomWeb.ChatLive.ChatRoom.Contacts do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Phoenix.PubSub
  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats
  alias Pomoroom.Users

  def handle_list_contacts(user, socket) do
    case Users.get_all_contacts(user.nickname) do
      {:ok, []} ->
        {:noreply, socket}

      {:ok, all_contacts} ->
        all_contact_list =
          Enum.reduce(all_contacts, [], fn contact, acc ->
            if Map.has_key?(contact, :admin) do
              [%{is_group: true, group_data: contact, status: "accepted"} | acc]
            else
              {to_user, from_user} =
                FriendRequests.determine_friend_request_users(contact.nickname, user.nickname)

              case FriendRequests.get(to_user, from_user) do
                {:ok, request} ->
                  [%{is_group: false, contact_data: contact, request: request} | acc]

                {:error, :not_found} ->
                  acc
              end
            end
          end)
          |> Enum.reverse()

        if all_contact_list != [] do
          payload = %{
            event_name: "show_list_contact",
            event_data: %{all_contact_list: all_contact_list}
          }

          {:noreply, push_event(socket, "react", payload)}
        else
          {:noreply, socket}
        end
    end
  end

  def handle_submit_contact_search(contact_name, user, socket) do
    case Users.get_by("nickname", contact_name) do
      {:ok, contact_data} ->
        {to_user, from_user} =
          FriendRequests.determine_friend_request_users(contact_name, user.nickname)

        request_data =
          case FriendRequests.get(to_user, from_user) do
            {:ok, request} -> request
            {:error, _reason} -> nil
          end

        payload = %{
          event_name: "search_contact_result",
          event_data: %{contact_data: contact_data, request_data: request_data}
        }

        {:noreply, push_event(socket, "react", payload)}

      {:error, _reason} ->
        payload = %{event_name: "contact_not_found", event_data: nil}
        {:noreply, push_event(socket, "react", payload)}
    end
  end

  def handle_delete_contact(contact_name, user, socket) do
    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(contact_name, user.nickname)

    case PrivateChats.get(to_user, from_user) do
      {:ok, private_chat} ->
        PrivateChats.delete_contact(private_chat.chat_id, user.nickname)
        PubSub.unsubscribe(Pomoroom.PubSub, "chat:#{private_chat.chat_id}")
        {:noreply, socket}

      {:error, _reason} ->
        {:noreply, socket}
    end
  end
end
