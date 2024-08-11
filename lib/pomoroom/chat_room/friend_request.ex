defmodule Pomoroom.ChatRoom.FriendRequest do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.ChatRoom.Contact
  alias Pomoroom.User

  schema "friend_requests" do
    field :status, :string
    field :chat_name, :string
    field :belongs_to_user, :string
    field :send_to_contact, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatRoom.FriendRequest{}
    |> cast(args, [
      :status,
      :chat_name,
      :belongs_to_user,
      :send_to_contact,
      :inserted_at,
      :updated_at
    ])
  end

  def request_changeset(args) do
    changeset(args)
    |> validate_required([
      :status,
      :chat_name,
      :belongs_to_user,
      :send_to_contact,
      :inserted_at,
      :updated_at
    ])
  end

  def request_changeset(public_id_chat, send_to_contact, belongs_to_user) do
    request = %{
      status: "pending",
      chat_name: public_id_chat,
      belongs_to_user: belongs_to_user,
      send_to_contact: send_to_contact
    }

    request
    |> changeset()
    |> validate_required([:status, :chat_name, :belongs_to_user, :send_to_contact])
  end

  def send_friend_request(public_id_chat, send_to_contact, belongs_to_user) do
    friend_request_changst =
      public_id_chat
      |> request_changeset(send_to_contact, belongs_to_user)
      |> timestamps()

    case Mongo.insert_one(:mongo, "friend_requests", friend_request_changst.changes) do
      {:ok, _result} ->
        if User.exists?(send_to_contact) do
          # me añado como su amigo
          Contact.add_contact(belongs_to_user, send_to_contact)
          # le añado como mi amigo -> return {:ok, contact}
          Contact.add_contact(send_to_contact, belongs_to_user)
        else
          # le añado como mi amigo -> return {:ok, contact}
          Contact.add_contact(send_to_contact, belongs_to_user)
        end

      {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => _errmsg}]}} ->
        {:error,
         %{error: "Ya hay una petición de amistad entre #{send_to_contact} y #{belongs_to_user}"}}
    end
  end

  def accept_friend_request(send_to_contact, belongs_to_user) do
    case get_request(send_to_contact, belongs_to_user) do
      {:ok, request} ->
        if request.status == "pending" do
          update_request(send_to_contact, belongs_to_user, "accepted")
          Contact.update_status(send_to_contact, belongs_to_user, "accepted")
          Contact.update_status(belongs_to_user, send_to_contact, "accepted")
          {:ok, "Accepted request"}
        else
          {:error, "Friend request already processed"}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get_request(send_to_contact, belongs_to_user) do
    friend_request_query = %{
      "belongs_to_user" => belongs_to_user,
      "send_to_contact" => send_to_contact
    }

    find_request = Mongo.find_one(:mongo, "friend_requests", friend_request_query)

    case find_request do
      nil ->
        {:error, :not_found}

      request_data when is_map(request_data) ->
        {:ok, get_changes_from_changeset(request_data)}

      error ->
        {:error, error}
    end
  end

  def is_owner_request?(send_to_contact, belongs_to_user) do
    case get_request(send_to_contact, belongs_to_user) do
      {:ok, request} ->
        if request.belongs_to_user == belongs_to_user do
          true
        else
          false
        end

      {:error, _reason} ->
        false
    end
  end

  def reject_friend_request(send_to_contact, belongs_to_user) do
    case get_request(send_to_contact, belongs_to_user) do
      {:ok, request} ->
        if request.status == "pending" do
          update_request(send_to_contact, belongs_to_user, "rejected")
          Contact.delete_contact(send_to_contact, belongs_to_user)
          Contact.delete_contact(belongs_to_user, send_to_contact)
          {:ok, "Rejected request "}
        else
          {:error, "Friend request already processed"}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_request(send_to_contact, belongs_to_user) do
    request_query = %{
      "belongs_to_user" => belongs_to_user,
      "send_to_contact" => send_to_contact
    }

    Mongo.delete_one(:mongo, "friend_requests", request_query)
  end

  def request_is_pending?(send_to_contact, belongs_to_user) do
    case get_request(send_to_contact, belongs_to_user) do
      {:ok, request} ->
        if request.status == "pending" do
          true
        else
          false
        end

      _ ->
        false
    end
  end

  def exists?(send_to_contact, belongs_to_user) do
    case get_request(send_to_contact, belongs_to_user) do
      {:ok, _request} ->
        true

      _ ->
        false
    end
  end

  defp timestamps(changeset) do
    change(changeset, %{inserted_at: NaiveDateTime.utc_now(), updated_at: NaiveDateTime.utc_now()})
  end

  defp get_changes_from_changeset(args) do
    request_changeset(args).changes
  end

  defp update_request(send_to_contact, belongs_to_user, status) do
    Mongo.update_one(
      :mongo,
      "friend_requests",
      %{belongs_to_user: belongs_to_user, send_to_contact: send_to_contact, status: "pending"},
      %{"$set": %{status: status, updated_at: NaiveDateTime.utc_now()}}
    )
  end
end