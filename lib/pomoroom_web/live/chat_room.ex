defmodule PomoroomWeb.ChatLive.ChatRoom do
  alias Pomoroom.ChatRoom.ChatServer
  use PomoroomWeb, :live_view
  alias Pomoroom.User
  alias Pomoroom.ChatRoom.{Contact, Chat, ChatServer, FriendRequest}

  def mount(_params, session, socket) do
    socket =
      socket
      |> PhoenixLiveSession.maybe_subscribe(session)
      |> put_session_assigns(session)

    send(self(), :get_list_contact)
    # IO.inspect(socket, structs: false, limit: :infinity)
    {:ok, socket, layout: false}
  end

  def handle_event("action.get_user_info", _args, %{assigns: %{user_info: user}} = socket) do
    payload = %{event_name: "show_user_info", event_data: user}
    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_info(:get_list_contact, %{assigns: %{user_info: user}} = socket) do
    {:ok, contact_list} = User.get_contacts(user.nickname)

    if Enum.empty?(contact_list) do
      {:noreply, socket}
    else
      # Para cada contacto en la lista, obtenemos la imagen de perfil.
      contact_list_with_images =
        Enum.map(contact_list, fn contact ->
          {:ok, contact_data} = User.get_by_nickname(contact.name)
          status_request = FriendRequest.get_status(contact.name, user.nickname)

          %{
            contact: contact,
            image_profile: contact_data.image_profile,
            status_request: status_request
          }
        end)

      payload = %{
        event_name: "show_list_contact",
        event_data: %{contact_list: contact_list_with_images}
      }

      {:noreply, push_event(socket, "react", payload)}
    end
  end

  # def handle_event(
  #       "action.add_contact",
  #       %{"is_group" => is_group, "name" => contact_name},
  #       %{assigns: %{user_info: user}} = socket
  #     ) do
  #   add_contact = Contact.add_contact(contact_name, user.nickname, is_group)

  #   case add_contact do
  #     {:ok, result} ->
  #       payload = %{event_name: "add_contact_to_list", event_data: result}
  #       {:noreply, push_event(socket, "react", payload)}

  #     {:error, reason} ->
  #       payload = %{event_name: "error_adding_contact", event_data: reason}
  #       {:noreply, push_event(socket, "react", payload)}
  #   end
  # end

  def handle_event("action.delete_contact", contact_name, %{assigns: %{user_info: user}} = socket) do
    Contact.delete_contact(contact_name, user.nickname)
    Chat.delete_chat(contact_name, user.nickname)

    if FriendRequest.request_is_pending?(contact_name, user.nickname) do
      FriendRequest.reject_friend_request(contact_name, user.nickname)
      FriendRequest.delete_request(contact_name, user.nickname)
    else
      FriendRequest.delete_request(contact_name, user.nickname)
    end

    {:noreply, socket}
  end

  def handle_event(
        "action.selected_chat",
        args,
        %{assigns: %{user_info: user}} = socket
      ) do
    %{"contact_name" => contact_name, "contact_status" => status_request} = args

    case Chat.ensure_chat_exists(contact_name, user.nickname) do
      {:ok, public_id_chat} ->
        ensure_chat_server_exists(public_id_chat)
        messages = ChatServer.get_messages(public_id_chat, 3)

        payload =
          case status_request do
            "accepted" ->
              {:ok, contact_data} = User.get_by_nickname(contact_name)
              image_profile = contact_data.image_profile

              %{
                event_name: "open_chat",
                event_data: %{
                  contact_name: contact_name,
                  messages: messages,
                  image_profile: image_profile
                }
              }

            "pending" ->
              if FriendRequest.is_owner_request?(contact_name, user.nickname) do
                %{
                  event_name: "open_chat_request_send",
                  event_data: %{contact_name: contact_name, owner_name: user.nickname}
                }
              else
                %{
                  event_name: "open_chat_request_received",
                  event_data: %{contact_name: user.nickname, owner_name: contact_name}
                }
              end

            "rejected" ->
              if FriendRequest.is_owner_request?(contact_name, user.nickname) do
                # clico sobre el chat -> abro rejected que recibi
                %{
                  event_name: "open_rejected_request_received",
                  event_data: %{contact_name: contact_name, owner_name: user.nickname}
                }
              else
                # clico sobre el chat -> abro rejected que envie
                %{
                  event_name: "open_rejected_request_send",
                  event_data: %{contact_name: user.nickname, owner_name: contact_name}
                }
              end
          end

        {:noreply, push_event(socket, "react", payload)}

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_event(
        "action.send_status_request",
        %{"status" => status, "contact_name" => contact_name, "owner_name" => owner_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    case status do
      "accepted" ->
        case FriendRequest.get_request(contact_name, owner_name) do
          {:ok, request} ->
            ChatServer.join_chat(request.chat_name)
            FriendRequest.accept_friend_request(contact_name, owner_name)
            {:ok, contact_data} = User.get_by_nickname(contact_name)
            image_profile = contact_data.image_profile

            payload = %{
              event_name: "open_chat",
              event_data: %{
                contact_name: contact_name,
                messages: [],
                image_profile: image_profile
              }
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            {:noreply, socket}
        end

      "rejected" ->
        FriendRequest.reject_friend_request(contact_name, owner_name)

        payload =
          if FriendRequest.is_owner_request?(contact_name, user.nickname) do
            %{
              event_name: "open_rejected_request_received",
              event_data: %{contact_name: contact_name, owner_name: user.nickname}
            }
          else
            %{
              event_name: "open_rejected_request_send",
              event_data: %{contact_name: user.nickname, owner_name: contact_name}
            }
          end

        {:noreply, push_event(socket, "react", payload)}

      _ ->
        {:noreply, socket}
    end
  end

  def handle_event(
        "action.send_message",
        %{"message" => message, "contact_name" => contact_name},
        %{assigns: %{user_info: user}} = socket
      ) do
    case Chat.ensure_chat_exists(contact_name, user.nickname) do
      {:ok, public_id_chat} ->
        case ChatServer.send_message(public_id_chat, user.nickname, message) do
          {:ok, msg} ->
            payload = %{event_name: "show_message_to_send", event_data: msg}
            {:noreply, push_event(socket, "react", payload)}

          {:error, reason} ->
            payload = %{event_name: "error_sending_message", event_data: reason}
            {:noreply, push_event(socket, "react", payload)}
        end

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_event(
        "action.send_friend_request",
        %{"send_to_contact" => send_to_contact},
        %{assigns: %{user_info: user}} = socket
      ) do
    if User.exists?(send_to_contact) do
      case Chat.ensure_chat_exists(send_to_contact, user.nickname) do
        {:ok, public_id_chat} ->
          if FriendRequest.exists?(user.nickname, send_to_contact) do
            {:error, reason} =
              FriendRequest.send_friend_request(public_id_chat, user.nickname, send_to_contact)

            payload = %{event_name: "error_adding_contact", event_data: reason}
            {:noreply, push_event(socket, "react", payload)}
          else
            case FriendRequest.send_friend_request(public_id_chat, send_to_contact, user.nickname) do
              {:ok, contact} ->
                {:ok, contact_data} = User.get_by_nickname(send_to_contact)
                status_request = FriendRequest.get_status(send_to_contact, user.nickname)

                payload = %{
                  event_name: "add_contact_to_list",
                  event_data: %{
                    contact: contact,
                    image_profile: contact_data.image_profile,
                    status_request: status_request
                  }
                }

                {:noreply, push_event(socket, "react", payload)}

              {:error, reason} ->
                payload = %{event_name: "error_adding_contact", event_data: reason}
                {:noreply, push_event(socket, "react", payload)}
            end
          end

        {:error, _reason} ->
          {:noreply, socket}
      end
    else
      payload = %{
        event_name: "error_adding_contact",
        event_data: %{error: "El contacto #{send_to_contact} no existe"}
      }

      {:noreply, push_event(socket, "react", payload)}
    end
  end

  # def handle_info(:receive_friend_requests, socket) do
  #   payload = %{event_name: "add_contact_to_list", event_data: users.user}
  #   {:noreply, push_event(socket, "react", payload)}
  # end

  def put_session_assigns(socket, session) do
    socket
    |> assign(:user_info, Map.get(session, "user_info", %{}))
  end

  defp ensure_chat_server_exists(chat_name) do
    case Registry.lookup(Registry.Chat, chat_name) do
      [] ->
        DynamicSupervisor.start_child(Pomoroom.ChatRoom.ChatSupervisor, {ChatServer, chat_name})
        :ok

      [_process] ->
        :ok
    end
  end
end
