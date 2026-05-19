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

      {:error, reason} ->
        {:error, reason}

      chat when is_map(chat) ->
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

  def update_members(chat_id, members) do
    query = %{"chat_id" => chat_id}
    now = NaiveDateTime.utc_now()

    Mongo.update_one(
      :mongo,
      "group_chats",
      query,
      %{"$set" => %{"members" => members, "updated_at" => now}}
    )
  end

  def add_plugin(chat_id, plugin) do
    update_plugin(chat_id, %{"$addToSet" => %{plugins: plugin}})
  end

  def remove_plugin(chat_id, plugin_type) do
    update_plugin(chat_id, %{"$pull" => %{plugins: %{"type" => plugin_type}}})
  end

  defp get_changes_from_changeset(args) do
    GroupChatSchema.group_chat_changeset(args).changes
    |> Map.put_new(:plugins, [])
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

    chat
    |> Map.put("members", normalized_members)
    |> Map.put_new("plugins", [])
  end

  defp update_plugin(chat_id, update) do
    query = %{"chat_id" => chat_id}

    case Mongo.update_one(:mongo, "group_chats", query, update) do
      {:ok, %Mongo.UpdateResult{matched_count: 0}} ->
        {:error, :chat_not_found}

      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end
end
