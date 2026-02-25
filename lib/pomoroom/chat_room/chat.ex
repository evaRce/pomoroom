defmodule Pomoroom.ChatRoom.Chat do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.GroupChats
  @max_num 100000

  def get_public_id_chat() do
    :rand.uniform(@max_num)
    |> Integer.to_string()
  end

  def get_members(collection, chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, collection, query) do
      nil ->
        {:error, "Chat no encontrado"}

      %{"members" => members} ->
        {:ok, members}
    end
  end

  def delete_chat(collection, chat_id) do
    Mongo.delete_one(:mongo, collection, %{chat_id: chat_id})
  end

  def is_group?(chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, "group_chats", query) do
      nil ->
        false

      _chat ->
        true
    end
  end

  def exists?(chat_id) do
    query = %{"chat_id" => chat_id}

    case Mongo.find_one(:mongo, "private_chats", query) do
      nil ->
        case Mongo.find_one(:mongo, "group_chats", query) do
          nil ->
            false

          _chat ->
            true
        end

      _chat ->
        true
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

  def get_all_group_chats_data(user) do
    {:ok, chat_ids} = get_chat_ids("group_chats", user)

    if Enum.empty?(chat_ids) do
      {:ok, []}
    else
      all_group_chats_data =
        Enum.map(chat_ids, fn chat_id ->
          {:ok, group_chat} = GroupChats.get_by("chat_id", chat_id)
          group_chat
        end)

      {:ok, all_group_chats_data}
    end
  end

  def get_all_chats_id(user) do
    {:ok, group_chats_id} = get_chat_ids("group_chats", user)
    {:ok, private_chats_id} = get_chat_ids("private_chats", user)
    group_chats_id ++ private_chats_id
  end

  def timestamps(changeset) do
    change(changeset, %{inserted_at: NaiveDateTime.utc_now(), updated_at: NaiveDateTime.utc_now()})
  end
end
