defmodule Pomoroom.Chats.ChatRepository do
  def delete_chat(collection, chat_id) do
    Mongo.delete_one(:mongo, collection, %{chat_id: chat_id})
  end

  def exists_in_collection?(collection, chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, collection, query) do
      nil -> false
      _chat -> true
    end
  end

  def get_chat_ids(collection, user) do
    query = %{"members" => user}

    case Mongo.find(:mongo, collection, query) |> Enum.to_list() do
      [] ->
        {:ok, []}

      chat_list ->
        chat_ids = Enum.map(chat_list, fn chat -> Map.get(chat, "chat_id") end)
        {:ok, chat_ids}
    end
  end
end