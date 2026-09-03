defmodule Pomoroom.FriendRequests.FriendRequestService do
  alias Pomoroom.PrivateChats
  alias Pomoroom.FriendRequests.{FriendRequestSchema, FriendRequestRepository}
  alias Pomoroom.Users
  import Ecto.Changeset
  import PomoroomWeb.Gettext

  @max_contacts 100

  def send_friend_request(to_user, from_user) when to_user == from_user do
    {:error, %{error: gettext("No puedes añadirte a ti mismo como un contacto")}}
  end

  def send_friend_request(to_user, from_user) do
    if not Users.exists_nickname?(to_user) do
      {:error, %{error: gettext("El usuario %{user} no existe", user: to_user)}}
    else
      case check_own_contacts_limit(from_user) do
        {:error, reason} ->
          {:error, reason}

        :ok ->
          friend_request_changeset =
            FriendRequestSchema.request_changeset(to_user, from_user)
            |> set_timestamps()

          case FriendRequestRepository.create(friend_request_changeset.changes) do
            {:ok, _result} ->
              {:ok, friend_request_changeset.changes}

            {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => _errmsg}]}} ->
              {:error,
               %{
                 error:
                   gettext("Ya hay una petición de amistad entre %{to_user} y %{from_user}",
                     to_user: to_user,
                     from_user: from_user
                   )
               }}
          end
      end
    end
  end

  def restore_contact_if_request_exists(to_user, from_user, who_restore) do
    deleted_by = if who_restore == from_user, do: from_user, else: to_user

    query = %{
      "sorted_members" => Enum.sort([to_user, from_user]),
      "deleted_by" => %{"$in" => [deleted_by]}
    }

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, %{error: gettext("El chat no existe o no fue eliminado por este usuario")}}

      chat ->
        case get(to_user, from_user) do
          {:error, :not_found} ->
            {:error, gettext("No hay una solicitud de amistad pendiente")}

          {:ok, request} ->
            PrivateChats.update_restore_deleted_contact(chat, who_restore)
            FriendRequestRepository.update_request_status(to_user, from_user, "accepted")
            {:ok, %{request | status: "accepted"}}
        end
    end
  end

  def accept_friend_request(to_user, from_user, logged_user_nickname) do
    case get_request_any_direction(to_user, from_user) do
      {:ok, %{status: "pending"} = request} ->
        if request.to_user != logged_user_nickname do
          {:error, %{error: gettext("No autorizado para aceptar esta solicitud de amistad")}}
        else
          case check_can_accept_contact(request.to_user, request.from_user) do
            {:error, reason} ->
              {:error, reason}

            :ok ->
              FriendRequestRepository.update_request_status(
                request.to_user,
                request.from_user,
                "accepted"
              )

              case PrivateChats.ensure_exists(request.to_user, request.from_user) do
                {:ok, _private_chat} ->
                  {:ok, %{request | status: "accepted"}}

                {:error, reason} ->
                  {:error, reason}
              end
          end
        end

      {:ok, _request} ->
        {:error, %{error: gettext("Petición de amistad ya aceptada")}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get(to_user, from_user), do: FriendRequestRepository.get(to_user, from_user)

  def list_without_private_chat_for_user(nickname),
    do: FriendRequestRepository.list_without_private_chat_for_user(nickname)

  def is_owner_request?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        request.from_user == from_user

      {:error, _reason} ->
        false
    end
  end

  def reject_friend_request(to_user, from_user, logged_user_nickname) do
    case get_request_any_direction(to_user, from_user) do
      {:ok, %{status: "pending"} = request} ->
        if request.to_user == logged_user_nickname do
          FriendRequestRepository.update_request_status(request.to_user, request.from_user, "rejected")
          {:ok, %{request | status: "rejected"}}
        else
          {:error, %{error: gettext("No autorizado para rechazar esta solicitud de amistad")}}
        end

      {:ok, _request} ->
        {:error, %{error: gettext("Petición de amistad ya rechazada")}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def cancel_friend_request(to_user, from_user, logged_user_nickname) do
    case get_request_any_direction(to_user, from_user) do
      {:ok, %{status: "pending"} = request} ->
        if request.from_user == logged_user_nickname do
          FriendRequestRepository.delete(request.to_user, request.from_user)
          {:ok, request}
        else
          {:error, %{error: gettext("No autorizado para cancelar esta solicitud de amistad")}}
        end

      {:ok, _request} ->
        {:error, %{error: gettext("La solicitud de amistad ya no está pendiente")}}

      {:error, :not_found} ->
        {:error, %{error: gettext("La solicitud de amistad ya no existe")}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_request(to_user, from_user), do: FriendRequestRepository.delete(to_user, from_user)

  def delete_request_between_users(user1, user2),
    do: FriendRequestRepository.delete_between_users(user1, user2)

  def delete_all_request(), do: FriendRequestRepository.delete_all()

  def request_is_pending?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, %{status: "pending"}} -> true
      _ -> false
    end
  end

  def get_status(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, %{status: status}} -> status

      {:error, _reason} ->
        case get(from_user, to_user) do
          {:ok, %{status: status}} -> status
          {:error, :not_found} -> :not_found
        end
    end
  end

  def exists?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, _request} -> true
      _ -> false
    end
  end

  def determine_friend_request_users(user1, user2) do
    case is_owner_request?(user1, user2) do
      true -> {user1, user2}
      false -> {user2, user1}
    end
  end

  defp check_can_accept_contact(to_user, from_user) do
    case check_own_contacts_limit(to_user) do
      {:error, reason} ->
        {:error, reason}

      :ok ->
        check_other_contacts_limit(from_user)
    end
  end

  defp check_own_contacts_limit(nickname) do
    if contacts_count(nickname) >= @max_contacts do
      {:error,
       %{error: gettext("Has alcanzado el máximo de %{max} contactos", max: @max_contacts)}}
    else
      :ok
    end
  end

  defp check_other_contacts_limit(nickname) do
    if contacts_count(nickname) >= @max_contacts do
      {:error,
       %{
         error:
           gettext("El usuario %{user} ya tiene el máximo de %{max} contactos",
             user: nickname,
             max: @max_contacts
           )
       }}
    else
      :ok
    end
  end

  defp contacts_count(nickname) do
    PrivateChats.count_active_chats(nickname)
  end

  defp get_request_any_direction(to_user, from_user) do
    case get(to_user, from_user) do
      {:error, :not_found} -> get(from_user, to_user)
      result -> result
    end
  end

  defp set_timestamps(changeset) do
    now = NaiveDateTime.utc_now()
    change(changeset, %{inserted_at: now, updated_at: now})
  end
end
