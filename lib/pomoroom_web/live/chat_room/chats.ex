defmodule PomoroomWeb.ChatLive.ChatRoom.Chats do
  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView, only: [push_event: 3]

  alias Pomoroom.ChatRoom.ChatServer
  alias Pomoroom.FriendRequests
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats
  alias Pomoroom.Users
  alias PomoroomWeb.ChatLive.ChatRoom.Runtime

  def handle_new_message_info(args, socket) do
    payload = %{
      event_name: "show_message_to_send",
      event_data: %{
        message: %{
          data: args.data,
          image_user: args.image_user
        }
      }
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_selected_private_chat(contact_name, user, socket) do
    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(contact_name, user.nickname)

    case PrivateChats.ensure_exists(to_user, from_user) do
      {:ok, private_chat} ->
        Runtime.ensure_chat_server_exists(private_chat.chat_id)
        {:ok, to_user_data} = Users.get_by("nickname", contact_name)
        {:ok, from_user_data} = Users.get_by("nickname", user.nickname)

        case FriendRequests.get(to_user, from_user) do
          {:ok, request} ->
            case request.status do
              "accepted" ->
                messages = ChatServer.get_messages(private_chat.chat_id, 20)

                messages_with_images_user =
                  Enum.map(messages, fn msg ->
                    image_user =
                      if msg.from_user == user.nickname do
                        from_user_data.image_profile
                      else
                        to_user_data.image_profile
                      end

                    %{data: msg, image_user: image_user}
                  end)

                socket = assign(socket, :chat_id, private_chat.chat_id)

                payload = %{
                  event_name: "open_private_chat",
                  event_data: %{
                    from_user_data: from_user_data,
                    to_user_data: to_user_data,
                    messages: messages_with_images_user
                  }
                }

                {:noreply, push_event(socket, "react", payload)}

              "pending" ->
                payload =
                  if FriendRequests.is_owner_request?(contact_name, user.nickname) do
                    %{event_name: "open_chat_request_send", event_data: %{request: request}}
                  else
                    %{event_name: "open_chat_request_received", event_data: %{request: request}}
                  end

                {:noreply, push_event(socket, "react", payload)}

              "rejected" ->
                payload =
                  if FriendRequests.is_owner_request?(contact_name, user.nickname) do
                    %{
                      event_name: "open_rejected_request_received",
                      event_data: %{rejected_request: request}
                    }
                  else
                    %{
                      event_name: "open_rejected_request_send",
                      event_data: %{rejected_request: request}
                    }
                  end

                {:noreply, push_event(socket, "react", payload)}
            end

          {:error, :not_found} ->
            {:noreply, socket}
        end

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_selected_group_chat(group_name, user, socket) do
    case GroupChats.get_by("name", group_name) do
      {:error, _reason} ->
        {:noreply, socket}

      {:ok, group_chat} ->
        Runtime.ensure_chat_server_exists(group_chat.chat_id)
        messages = ChatServer.get_messages(group_chat.chat_id, 20)

        case GroupChats.get_members(group_name) do
          {:ok, members_data} ->
            messages_with_images_user =
              Enum.map(messages, fn msg ->
                case Users.get_by("nickname", msg.from_user) do
                  {:ok, user_data} ->
                    %{
                      data: msg,
                      image_user: user_data.image_profile
                    }

                  {:error, _reason} ->
                    %{
                      data: msg,
                      image_user: nil
                    }
                end
              end)

            payload = %{
              event_name: "open_group_chat",
              event_data: %{
                is_admin: GroupChats.is_admin?(group_chat.name, user.nickname),
                group_data: group_chat,
                messages: messages_with_images_user,
                members_data: members_data
              }
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            {:noreply, socket}
        end
    end
  end

  def handle_send_private_message(message, to_user_arg, user, socket) do
    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(to_user_arg, user.nickname)

    case PrivateChats.get(to_user, from_user) do
      {:ok, private_chat} ->
        {:ok, from_user_data} = Users.get_by("nickname", user.nickname)

        case ChatServer.send_message(
              private_chat.chat_id,
              from_user_data.nickname,
              from_user_data.image_profile,
              message
            ) do
          {:ok, _msg} ->
            {:noreply, socket}

          {:error, reason} ->
            payload = %{event_name: "error_sending_message", event_data: reason}
            {:noreply, push_event(socket, "react", payload)}
        end

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_send_group_message(message, to_group_name, user, socket) do
    case GroupChats.get_by("name", to_group_name) do
      {:error, _reason} ->
        {:noreply, socket}

      {:ok, group_chat} ->
        {:ok, from_user_data} = Users.get_by("nickname", user.nickname)

        case ChatServer.send_message(
              group_chat.chat_id,
              from_user_data.nickname,
              from_user_data.image_profile,
              message
            ) do
          {:ok, _msg} ->
            {:noreply, socket}

          {:error, reason} ->
            payload = %{event_name: "error_sending_message", event_data: reason}
            {:noreply, push_event(socket, "react", payload)}
        end
    end
  end
end
