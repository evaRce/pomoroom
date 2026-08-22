defmodule PomoroomWeb.ChatLive.ChatRoom.FriendRequests do
  import PomoroomWeb.ChatLive.ChatRoom.ReactEvent
  import PomoroomWeb.Gettext

  alias Phoenix.PubSub
  alias Pomoroom.Chats.Runtime.ChatServer
  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats
  alias Pomoroom.Users

  @max_requests 5
  @scale_ms :timer.minutes(1)

  def handle_friend_request_sent(payload, socket) do
    notify_react(socket, payload)
  end

  def handle_friend_request_accepted(payload, chat_id, socket) do
    PubSub.subscribe(Pomoroom.PubSub, "chat:#{chat_id}")
    notify_react(socket, payload)
  end

  def handle_friend_request_rejected(payload, socket) do
    notify_react(socket, payload)
  end

  def handle_update_status_request(status, to_user_name, from_user_name, user_nickname, socket) do
    case status do
      "accepted" ->
        case FriendRequests.accept_friend_request(to_user_name, from_user_name, user_nickname) do
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

                notify_react(socket, payload)

              {:error, _reason} ->
                event_data = %{
                  error: gettext("Inconsistencia detectada: solicitud aceptada sin chat privado")
                }

                notify_react(socket, "error_accepting_friend_request", event_data)
            end

          {:error, reason} ->
            notify_react(socket, "error_accepting_friend_request", reason)
        end

      "rejected" ->
        case FriendRequests.reject_friend_request(to_user_name, from_user_name, user_nickname) do
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

            notify_react(socket, payload)

          {:error, _reason} ->
            {:noreply, socket}
        end

      _ ->
        {:noreply, socket}
    end
  end

  def handle_send_friend_request(to_user_arg, user, socket) do
    user_nickname = user.nickname

    case PomoroomWeb.RateLimiter.hit("friend_request:#{user_nickname}", @scale_ms, @max_requests) do
      {:deny, _retry_after} ->
        event_data = %{
          error: gettext("Demasiadas solicitudes enviadas. Inténtalo de nuevo en un minuto")
        }

        notify_react(socket, "error_adding_contact", event_data)

      {:allow, _count} ->
        do_send_friend_request(to_user_arg, user, socket)
    end
  end

  defp do_send_friend_request(to_user_arg, user, socket) do
    user_nickname = user.nickname

    cond do
      to_user_arg == user_nickname ->
        {:error, reason} = FriendRequests.send_friend_request(to_user_arg, user_nickname)
        notify_react(socket, "error_adding_contact", reason)

      not Users.exists_nickname?(to_user_arg) ->
        event_data = %{error: gettext("El usuario %{user} no existe", user: to_user_arg)}
        notify_react(socket, "error_adding_contact", event_data)

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

                    notify_react(socket, payload)

                  {:error, reason} ->
                    notify_react(socket, "error_adding_contact", reason)
                end

              "pending" ->
                event_data = %{
                  error: gettext("Ya hay una petición de amistad pendiente entre ambos usuarios")
                }

                notify_react(socket, "error_adding_contact", event_data)

              "rejected" ->
                event_data = %{error: gettext("La petición fue rechazada previamente")}
                notify_react(socket, "error_adding_contact", event_data)

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
                          event_data: %{error: gettext("El contacto ya está añadido")}
                        }
                      end

                    notify_react(socket, payload)

                  {:error, _reason} ->
                    event_data = %{
                      error:
                        gettext("Inconsistencia detectada: solicitud aceptada sin chat privado")
                    }

                    notify_react(socket, "error_adding_contact", event_data)
                end
            end

          {:error, reason} ->
            notify_react(socket, "error_adding_contact", reason)
        end
    end
  end
end
