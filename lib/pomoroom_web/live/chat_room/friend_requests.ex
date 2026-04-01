defmodule PomoroomWeb.ChatLive.ChatRoom.FriendRequests do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Phoenix.PubSub
  alias Pomoroom.ChatRoom.ChatServer
  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats
  alias Pomoroom.Users

  def handle_friend_request_sent(payload, socket) do
    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_friend_request_accepted(payload, chat_id, socket) do
    PubSub.subscribe(Pomoroom.PubSub, "chat:#{chat_id}")
    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_friend_request_rejected(payload, socket) do
    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_update_status_request(status, to_user_name, from_user_name, user_nickname, socket) do
    case status do
      "accepted" ->
        case FriendRequests.accept_friend_request(to_user_name, from_user_name) do
          {:ok, request} ->
            case PrivateChats.get(request.to_user, request.from_user) do
              {:ok, private_chat} ->
                ChatServer.join_chat(private_chat.chat_id)
                PubSub.subscribe(Pomoroom.PubSub, "chat:#{private_chat.chat_id}")

                payload = %{
                  event_name: "update_contact_status_to_accepted",
                  event_data: %{
                    request: request,
                    new_status: status
                  }
                }

                PubSub.broadcast(
                  Pomoroom.PubSub,
                  "friend_request:#{request.from_user}",
                  {:friend_request_change_status, payload, private_chat.chat_id}
                )

                {:noreply, push_event(socket, "react", payload)}
              {:error, _reason} ->
                {:noreply, socket}
            end
          {:error, _reason} ->
            {:noreply, socket}
        end
      "rejected" ->
        case FriendRequests.reject_friend_request(to_user_name, from_user_name) do
          {:ok, request} ->
            payload =
              if request.to_user == user_nickname do
                %{
                  event_name: "open_rejected_request_send",
                  event_data: %{
                    rejected_request: request
                  }
                }
              else
                %{
                  event_name: "open_rejected_request_received",
                  event_data: %{
                    rejected_request: request
                  }
                }
              end

            payload_to_broadcast =
              %{
                event_name: "open_rejected_request_received",
                event_data: %{
                  rejected_request: request
                }
              }

            PubSub.broadcast(
              Pomoroom.PubSub,
              "friend_request:#{request.from_user}",
              {:friend_request_change_status, payload_to_broadcast}
            )

            {:noreply, push_event(socket, "react", payload)}
          {:error, _reason} ->
            {:noreply, socket}
        end
      _ ->
        {:noreply, socket}
    end
  end

  def handle_send_friend_request(to_user_arg, user, socket) do
    user_nickname = user.nickname

    cond do
      to_user_arg == user_nickname ->
        {:error, reason} = FriendRequests.send_friend_request(to_user_arg, user_nickname)
        payload = %{event_name: "error_adding_contact", event_data: reason}
        {:noreply, push_event(socket, "react", payload)}

      not Users.exists_nickname?(to_user_arg) ->
        payload = %{
          event_name: "error_adding_contact",
          event_data: %{error: "El usuario #{to_user_arg} no existe"}
        }
        {:noreply, push_event(socket, "react", payload)}

      true ->
        case Users.get_by("nickname", to_user_arg) do
          {:ok, to_user_data} ->
            case FriendRequests.get_status(to_user_arg, user_nickname) do
              :not_found ->
                case FriendRequests.send_friend_request(to_user_arg, user_nickname) do
                  {:ok, request} ->
                    payload = %{
                      event_name: "add_contact_to_list",
                      event_data: %{
                        is_group: false,
                        contact_data: to_user_data,
                        request: request
                      }
                    }

                    payload_from_user = %{
                      event_name: "add_contact_to_list",
                      event_data: %{
                        is_group: false,
                        contact_data: user,
                        request: request
                      }
                    }

                    PubSub.broadcast(
                      Pomoroom.PubSub,
                      "friend_request:#{to_user_arg}",
                      {:friend_request_sent, payload_from_user}
                    )

                    {:noreply, push_event(socket, "react", payload)}
                  _ ->
                    {:noreply, socket}
                end

              "pending" ->
                payload = %{
                  event_name: "error_adding_contact",
                  event_data: %{error: "Ya hay una petición de amistad pendiente entre ambos usuarios"}
                }
                {:noreply, push_event(socket, "react", payload)}

              "rejected" ->
                payload = %{
                  event_name: "error_adding_contact",
                  event_data: %{error: "La petición fue rechazada previamente"}
                }
                {:noreply, push_event(socket, "react", payload)}

              "accepted" ->
                {to_user, from_user} =
                  FriendRequests.determine_friend_request_users(to_user_arg, user_nickname)

                case PrivateChats.get(to_user, from_user) do
                  {:ok, private_chat} ->
                    payload =
                      if Enum.member?(private_chat.deleted_by, user_nickname) do
                        case FriendRequests.restore_contact_if_request_exists(
                               to_user,
                               from_user,
                               user_nickname
                             ) do
                          {:ok, request} ->
                            PubSub.subscribe(Pomoroom.PubSub, "chat:#{private_chat.chat_id}")
                            %{
                              event_name: "add_contact_to_list",
                              event_data: %{
                                is_group: false,
                                contact_data: to_user_data,
                                request: request
                              }
                            }
                          {:error, reason} ->
                            %{event_name: "error_adding_contact", event_data: reason}
                        end
                      else
                        %{
                          event_name: "error_adding_contact",
                          event_data: %{error: "El contacto ya está añadido"}
                        }
                      end
                    {:noreply, push_event(socket, "react", payload)}
                  {:error, _reason} ->
                    payload = %{
                      event_name: "error_adding_contact",
                      event_data: %{error: "Inconsistencia detectada: solicitud aceptada sin chat privado"}
                    }
                    {:noreply, push_event(socket, "react", payload)}
                end
            end
          {:error, reason} ->
            payload = %{event_name: "error_adding_contact", event_data: reason}
            {:noreply, push_event(socket, "react", payload)}
        end
    end
  end
end
