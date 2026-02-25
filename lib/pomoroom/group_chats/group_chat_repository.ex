defmodule Pomoroom.GroupChats.GroupChatRepository do
  alias Pomoroom.GroupChats.GroupChatSchema

  def create(changes) do
    Mongo.insert_one(:mongo, "group_chats", changes)
  end

  def delete_all() do
    Mongo.delete_many(:mongo, "group_chats", %{})
  end

  def get_by(field, value) do
    query = %{field => value}

    case Mongo.find_one(:mongo, "group_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

  def update_by_chat_id(chat_id, operator, operation) do
    query = %{"chat_id" => chat_id}
    now = NaiveDateTime.utc_now()

    Mongo.update_one(
      :mongo,
      "group_chats",
      query,
      %{operator => operation, "$set" => %{updated_at: now}}
    )
  end

  defp get_changes_from_changeset(args) do
    GroupChatSchema.group_chat_changeset(args).changes
  end
end
