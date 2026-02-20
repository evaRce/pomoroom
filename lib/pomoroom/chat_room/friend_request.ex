defmodule Pomoroom.ChatRoom.FriendRequest do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.ChatRoom.PrivateChat
  alias Pomoroom.Users

  schema "friend_requests" do
    field :status, :string
    field :from_user, :string
    field :to_user, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatRoom.FriendRequest{}
    |> cast(args, [
      :status,
      :from_user,
      :to_user,
      :inserted_at,
      :updated_at
    ])
  end

  def request_changeset(args) do
    changeset(args)
    |> validate_required([
      :status,
      :from_user,
      :to_user,
      :inserted_at,
      :updated_at
    ])
  end

  def request_changeset(to_user, from_user) do
    request = %{
      status: "pending",
      from_user: from_user,
      to_user: to_user
    }

    request
    |> changeset()
    |> validate_required([:status, :from_user, :to_user])
  end

  def send_friend_request(to_user, from_user) when to_user == from_user do
    {:error, %{error: "No puedes añadirte a ti mismo como un contacto"}}
  end

  def send_friend_request(to_user, from_user) do
    if Users.exists_nickname?(to_user) do
      friend_request_changst =
        request_changeset(to_user, from_user)
        |> timestamps()

      case Mongo.insert_one(:mongo, "friend_requests", friend_request_changst.changes) do
        {:ok, _result} ->
          PrivateChat.ensure_exists(to_user, from_user)
          {:ok, friend_request_changst.changes}

        {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => _errmsg}]}} ->
          {:error, %{error: "Ya hay una petición de amistad entre #{to_user} y #{from_user}"}}
      end
    else
      {:error, %{error: "El usuario #{to_user} no existe"}}
    end
  end

  def restore_contact_if_request_exists(to_user, from_user, who_restore) do
    deleted_by =
      if who_restore == from_user, do: from_user, else: to_user

    query = %{"members" => [to_user, from_user], "deleted_by" => %{"$in" => [deleted_by]}}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, %{error: "El chat no existe o no fue eliminado por este usuario"}}

      chat ->
        case get(to_user, from_user) do
          {:error, :not_found} ->
            {:error, "No hay una solicitud de amistad pendiente"}

          {:ok, request} ->
            PrivateChat.update_restore_deleted_contact(chat, who_restore)
            # "Contacto restaurado"
            {:ok, request}
        end
    end
  end

  def accept_friend_request(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        if request.status == "pending" do
          update_request(to_user, from_user, "accepted")
          {:ok, "Petición de amistad aceptada"}
        else
          {:error, %{error: "Petición de amistad ya aceptada"}}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get(to_user, from_user) do
    request_query = %{"to_user" => to_user, "from_user" => from_user}

    case Mongo.find_one(:mongo, "friend_requests", request_query) do
      nil ->
        {:error, :not_found}

      request_data when is_map(request_data) ->
        {:ok, get_changes_from_changeset(request_data)}
    end
  end

  def is_owner_request?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        if request.from_user == from_user, do: true, else: false

      {:error, _reason} ->
        false
    end
  end

  def reject_friend_request(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        if request.status == "pending" do
          update_request(to_user, from_user, "rejected")
          {:ok, "Petición de amistad rechazada"}
        else
          {:error, %{error: "Petición de amistad ya rechazada"}}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_request(to_user, from_user) do
    request_query = %{"to_user" => to_user, "from_user" => from_user}

    Mongo.delete_one(:mongo, "friend_requests", request_query)
    :ok
  end

  def delete_all_request() do
    Mongo.delete_many(:mongo, "friend_requests", %{})
  end

  def request_is_pending?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        if request.status == "pending", do: true, else: false

      _ ->
        false
    end
  end

  def get_status(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, request} ->
        request.status

      {:error, _reason} ->
        case get(from_user, to_user) do
          {:ok, request} ->
            request.status

          {:error, :not_found} ->
            :not_found
        end
    end
  end

  def exists?(to_user, from_user) do
    case get(to_user, from_user) do
      {:ok, _request} ->
        true

      _ ->
        false
    end
  end

  def determine_friend_request_users(user1, user2) do
    if is_owner_request?(user1, user2) do
      {user1, user2}
    else
      {user2, user1}
    end
  end

  defp timestamps(changeset) do
    change(changeset, %{inserted_at: NaiveDateTime.utc_now(), updated_at: NaiveDateTime.utc_now()})
  end

  defp get_changes_from_changeset(args) do
    request_changeset(args).changes
  end

  defp update_request(to_user, from_user, status) do
    Mongo.update_one(
      :mongo,
      "friend_requests",
      %{from_user: from_user, to_user: to_user, status: "pending"},
      %{"$set": %{status: status, updated_at: NaiveDateTime.utc_now()}}
    )
  end
end
