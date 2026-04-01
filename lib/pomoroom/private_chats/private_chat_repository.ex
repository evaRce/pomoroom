defmodule Pomoroom.PrivateChats.PrivateChatRepository do
  alias Pomoroom.PrivateChats.PrivateChatSchema

  def create(changes) do
    Mongo.insert_one(:mongo, "private_chats", changes)
  end

  def delete_all() do
    Mongo.delete_many(:mongo, "private_chats", %{})
  end

  def get_by_chat_id(chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat when is_map(chat) ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def get_by_members(to_user, from_user) do
    query = %{"sorted_members" => Enum.sort([to_user, from_user])}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat when is_map(chat) ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def get_existing_chat(to_user, from_user) do
    query = %{"sorted_members" => Enum.sort([to_user, from_user])}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        nil

      chat when is_map(chat) ->
        get_changes_from_changeset(chat)
    end
  end

  def mark_deleted(chat_id, from_user) do
    now = NaiveDateTime.utc_now()

    Mongo.update_one(
      :mongo,
      "private_chats",
      %{chat_id: chat_id},
      %{"$addToSet" => %{deleted_by: from_user}, "$set" => %{updated_at: now}}
    )
  end

  def restore_deleted(chat, from_user) do
    chat_id = Map.get(chat, "chat_id")
    members_list = Map.get(chat, "members", [])
    now = NaiveDateTime.utc_now()
    new_timestamp = DateTime.utc_now()

    updated_members =
      Enum.map(members_list, fn member ->
        user_id = Map.get(member, "user_id") || Map.get(member, :user_id)

        if user_id == from_user do
          Map.put(member, "joined_at", new_timestamp)
        else
          member
        end
      end)

    Mongo.update_one(
      :mongo,
      "private_chats",
      %{"chat_id" => chat_id},
      %{
        "$pull" => %{deleted_by: from_user},
        "$set" => %{
          "updated_at" => now,
          "members" => updated_members
        }
      }
    )

    :ok
  end

  defp get_changes_from_changeset(args) do
    PrivateChatSchema.private_chat_changeset(args).changes
  end
end
