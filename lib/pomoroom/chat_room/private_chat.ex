defmodule Pomoroom.ChatRoom.PrivateChat do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.ChatRoom.{Chat, Message}
  alias Pomoroom.FriendRequests, as: FriendRequests

  schema "private_chats" do
    field :chat_id, :string
    field :members, {:array, :string}
    field :sorted_members, {:array, :string}
    field :deleted_by, {:array, :string}
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatRoom.PrivateChat{}
    |> cast(args, [
      :chat_id,
      :members,
      :sorted_members,
      :deleted_by,
      :inserted_at,
      :updated_at
    ])
  end

  def private_chat_changeset(args) do
    changeset(args)
    |> validate_required([
      :chat_id,
      :members,
      :sorted_members,
      :deleted_by,
      :inserted_at,
      :updated_at
    ])
  end

  def private_chat_changeset(chat_id, members) do
    private_chat = %{
      chat_id: chat_id,
      members: members,
      sorted_members: Enum.sort(members),
      deleted_by: []
    }

    changeset(private_chat)
    |> validate_required([:chat_id, :members, :sorted_members, :deleted_by])
  end

  def create_private_chat(to_user, from_user) do
    private_chat_changst =
      Chat.get_public_id_chat()
      |> private_chat_changeset([to_user, from_user])
      |> Chat.timestamps()

    case private_chat_changst.valid? do
      true ->
        case Mongo.insert_one(:mongo, "private_chats", private_chat_changst.changes) do
          {:ok, _result} ->
            {:ok, private_chat_changst.changes}

          {:error, _reason} ->
            {:error, %{error: "El contacto ya está añadido"}}
        end

      false ->
        {:error, %{error: "Hay un campo invalido"}}
    end
  end

  def delete_contact(chat_id, from_user) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat ->
        update_delete(chat_id, from_user)
        {:ok, updated_chat} = get(chat_id)
        [member1, member2] = Map.get(chat, "members")

        if both_users_deleted?(updated_chat.deleted_by, [member1, member2]) do
          Chat.delete_chat("private_chats", chat_id)
          FriendRequests.delete_request(member1, member2)
          Message.delete_all_belongs_to_chat(chat_id)
        end

        {:ok, "Contacto eliminado"}
    end
  end

  def delete_all_private_chats() do
    Mongo.delete_many(:mongo, "private_chats", %{})
  end

  def get(chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat when is_map(chat) ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def get(to_user, from_user) do
    query = %{"members" => [to_user, from_user]}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat when is_map(chat) ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def ensure_exists(to_user, from_user) do
    query = %{
      members: %{"$all" => [to_user, from_user]},
      chat_id: %{"$exists" => true, "$ne" => nil}
    }

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        create_private_chat(to_user, from_user)

      chat when is_map(chat) ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def update_restore_deleted_contact(chat, from_user) do
    Mongo.update_one(
      :mongo,
      "private_chats",
      %{chat_id: Map.get(chat, "chat_id")},
      %{"$pull" => %{deleted_by: from_user}, "$set" => %{updated_at: NaiveDateTime.utc_now()}}
    )
  end

  defp update_delete(chat_id, from_user) do
    Mongo.update_one(
      :mongo,
      "private_chats",
      %{chat_id: chat_id},
      %{"$addToSet" => %{deleted_by: from_user}, "$set" => %{updated_at: NaiveDateTime.utc_now()}}
    )
  end

  def both_users_deleted?(deleted_by, members) do
    Enum.all?(members, fn member -> member in deleted_by end)
  end

  defp get_changes_from_changeset(args) do
    private_chat_changeset(args).changes
  end
end
