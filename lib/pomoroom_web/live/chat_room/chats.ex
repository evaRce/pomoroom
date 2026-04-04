defmodule PomoroomWeb.ChatLive.ChatRoom.Chats do
  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView, only: [push_event: 3]

  alias Pomoroom.ChatRoom.ChatServer
  alias Pomoroom.FriendRequests
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats
  alias Pomoroom.Users
  alias PomoroomWeb.ChatLive.ChatRoom.Runtime

  @initial_messages_limit 20
  @older_messages_limit 15

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

        case FriendRequests.get(to_user, from_user) do
          {:ok, request} ->
            is_owner_request = FriendRequests.is_owner_request?(contact_name, user.nickname)

            case request.status do
              "accepted" ->
                open_accepted_private_chat(private_chat, contact_name, user, socket)

              "pending" ->
                payload =
                  build_private_chat_request_payload("pending", request, is_owner_request)

                {:noreply, push_event(socket, "react", payload)}

              "rejected" ->
                payload =
                  build_private_chat_request_payload("rejected", request, is_owner_request)

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

        case GroupChats.member_state(group_name, user.nickname) do
          {:active, joined_at} ->
            open_group_chat_with_members(group_name, group_chat, user, joined_at, nil, socket)

          {:removed, joined_at, removed_at} ->
            open_group_chat_with_members(
              group_name,
              group_chat,
              user,
              joined_at,
              removed_at,
              socket
            )

          :not_member ->
            {:noreply, socket}
        end
    end
  end

  def handle_send_private_message(message, to_user_arg, user, socket) do
    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(to_user_arg, user.nickname)

    case PrivateChats.get(to_user, from_user) do
      {:error, _reason} ->
        {:noreply, socket}

      {:ok, private_chat} ->
        send_message_to_chat(private_chat.chat_id, message, user, socket)
    end
  end

  def handle_send_group_message(message, to_group_name, user, socket) do
    if GroupChats.can_send_message?(to_group_name, user.nickname) do
      case GroupChats.get_by("name", to_group_name) do
        {:error, _reason} ->
          {:noreply, socket}

        {:ok, group_chat} ->
          send_message_to_chat(group_chat.chat_id, message, user, socket)
      end
    else
      chat_id =
        case GroupChats.get_by("name", to_group_name) do
          {:ok, group_chat} -> group_chat.chat_id
          {:error, _reason} -> nil
        end

      payload = %{
        event_name: "group_member_removed",
        event_data: %{
          chat_id: chat_id,
          group_name: to_group_name,
          disable_send: true
        }
      }

      {:noreply, push_event(socket, "react", payload)}
    end
  end

  defp open_group_chat_with_members(group_name, group_chat, user, joined_at, removed_at, socket) do
    messages =
      ChatServer.get_messages(group_chat.chat_id, @initial_messages_limit, joined_at)

    visible_messages =
      if is_nil(removed_at) do
        messages
      else
        Enum.filter(messages, fn msg ->
          case NaiveDateTime.compare(
                 to_naive_datetime(msg.inserted_at),
                 to_naive_datetime(removed_at)
               ) do
            :gt -> false
            _ -> true
          end
        end)
      end

    is_admin = GroupChats.is_admin?(group_name, user.nickname)
    user_image_map_by_nickname = build_user_image_map_by_nickname(visible_messages)

    socket =
      socket
      |> assign(:chat_id, group_chat.chat_id)
      |> assign(:current_group_joined_at, joined_at)
      |> assign(:current_group_removed_at, removed_at)

    messages_with_images_user =
      Enum.map(visible_messages, fn msg ->
        %{
          data: msg,
          image_user: Map.get(user_image_map_by_nickname, msg.from_user)
        }
      end)

    payload = %{
      event_name: "open_group_chat",
      event_data: %{
        chat_id: group_chat.chat_id,
        is_admin: is_admin,
        group_data: group_chat,
        messages: messages_with_images_user,
        has_more: length(messages_with_images_user) == @initial_messages_limit,
        removed_at: removed_at
      }
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_load_older_messages(chat_id, before_inserted_at, socket) do
    handle_load_older_messages(chat_id, before_inserted_at, nil, socket)
  end

  def handle_load_older_messages(chat_id, before_inserted_at, before_db_id, socket) do
    handle_load_older_messages(chat_id, before_inserted_at, before_db_id, nil, socket)
  end

  def handle_load_older_messages(chat_id, before_inserted_at, before_db_id, joined_at, socket) do
    case parse_inserted_at(before_inserted_at) do
      {:ok, parsed_inserted_at} ->
        older_messages =
          ChatServer.get_messages_before(
            chat_id,
            parsed_inserted_at,
            @older_messages_limit,
            before_db_id,
            joined_at
          )

        user_image_map_by_nickname = build_user_image_map_by_nickname(older_messages)

        older_messages_with_images_user =
          Enum.map(older_messages, fn msg ->
            %{
              data: msg,
              image_user: Map.get(user_image_map_by_nickname, msg.from_user)
            }
          end)

        payload = %{
          event_name: "show_older_messages",
          event_data: %{
            messages: older_messages_with_images_user,
            has_more: length(older_messages_with_images_user) == @older_messages_limit
          }
        }

        {:noreply, push_event(socket, "react", payload)}

      _ ->
        {:noreply, socket}
    end
  end

  defp send_message_to_chat(chat_id, message, user, socket) do
    case ChatServer.send_message(chat_id, user.nickname, user.image_profile, message) do
      {:ok, _msg} ->
        {:noreply, socket}

      {:error, reason} ->
        payload = %{event_name: "error_sending_message", event_data: reason}
        {:noreply, push_event(socket, "react", payload)}
    end
  end

  defp open_accepted_private_chat(private_chat, contact_name, user, socket) do
    case Users.get_by("nickname", contact_name) do
      {:ok, to_user_data} ->
        joined_at = PrivateChats.get_member_joined_at(private_chat, user.nickname)

        messages =
          ChatServer.get_messages(private_chat.chat_id, @initial_messages_limit, joined_at)

        messages_with_images_user =
          Enum.map(messages, fn msg ->
            image_user =
              if msg.from_user == user.nickname do
                user.image_profile
              else
                to_user_data.image_profile
              end

            %{data: msg, image_user: image_user}
          end)

        socket = assign(socket, :chat_id, private_chat.chat_id)
        socket = assign(socket, :current_group_joined_at, joined_at)

        payload = %{
          event_name: "open_private_chat",
          event_data: %{
            chat_id: private_chat.chat_id,
            from_user_data: user,
            to_user_data: to_user_data,
            messages: messages_with_images_user,
            has_more: length(messages_with_images_user) == @initial_messages_limit
          }
        }

        {:noreply, push_event(socket, "react", payload)}

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  defp build_user_image_map_by_nickname(messages) do
    Enum.reduce(messages, %{}, fn msg, acc ->
      nickname = msg.from_user

      if Map.has_key?(acc, nickname) do
        acc
      else
        case Users.get_by("nickname", nickname) do
          {:ok, user_data} ->
            Map.put(acc, nickname, user_data.image_profile)

          {:error, _reason} ->
            Map.put(acc, nickname, nil)
        end
      end
    end)
  end

  defp build_private_chat_request_payload(status, request, is_owner_request) do
    case {status, is_owner_request} do
      {"pending", true} ->
        %{event_name: "open_chat_request_send", event_data: %{request: request}}

      {"pending", false} ->
        %{event_name: "open_chat_request_received", event_data: %{request: request}}

      {"rejected", true} ->
        %{event_name: "open_rejected_request_received", event_data: %{rejected_request: request}}

      {"rejected", false} ->
        %{event_name: "open_rejected_request_send", event_data: %{rejected_request: request}}
    end
  end

  defp parse_inserted_at(inserted_at) when is_binary(inserted_at) do
    case NaiveDateTime.from_iso8601(inserted_at) do
      {:ok, naive_datetime} ->
        {:ok, naive_datetime}

      {:error, _reason} ->
        case DateTime.from_iso8601(inserted_at) do
          {:ok, datetime, _offset} -> {:ok, DateTime.to_naive(datetime)}
          {:error, _} -> {:error, :invalid_inserted_at}
        end
    end
  end

  defp parse_inserted_at(_), do: {:error, :invalid_inserted_at}

  defp to_naive_datetime(%DateTime{} = datetime), do: DateTime.to_naive(datetime)
  defp to_naive_datetime(%NaiveDateTime{} = datetime), do: datetime
  defp to_naive_datetime(value), do: value
end
