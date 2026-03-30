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
        normalized_chat = normalize_legacy_members(chat)
        {:ok, get_changes_from_changeset(normalized_chat)}
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

  defp normalize_legacy_members(chat) when is_map(chat) do
    members = Map.get(chat, "members", [])

    normalized_members =
      Enum.map(members, fn member ->
        cond do
          is_binary(member) -> %{"user_id" => member, "joined_at" => nil}
          is_map(member) -> member
          true -> nil
        end
      end)
      |> Enum.reject(&is_nil/1)

    Map.put(chat, "members", normalized_members)
  end
end
