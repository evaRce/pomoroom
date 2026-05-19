defmodule Pomoroom.Chats.ChatService do
  alias Pomoroom.Chats.ChatRepository
  alias Pomoroom.GroupChats
  import Ecto.Changeset

  def generate_chat_id() do
    Ecto.UUID.generate()
  end

  def delete_chat(collection, chat_id) do
    ChatRepository.delete_chat(collection, chat_id)
  end

  def exists?(chat_id) do
    ChatRepository.exists_in_collection?("private_chats", chat_id) or
      ChatRepository.exists_in_collection?("group_chats", chat_id)
  end

  def get_all_group_chats_data(user) do
    {:ok, chat_ids} = ChatRepository.get_chat_ids("group_chats", user)

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
    group_chats_id =
      case ChatRepository.get_chat_ids("group_chats", user) do
        {:ok, ids} -> ids
        {:error, _reason} -> []
      end

    private_chats_id =
      case ChatRepository.get_chat_ids("private_chats", user) do
        {:ok, ids} -> ids
        {:error, _reason} -> []
      end

    group_chats_id ++ private_chats_id
  end

  def timestamps(changeset) do
    now = NaiveDateTime.utc_now()
    change(changeset, %{inserted_at: now, updated_at: now})
  end
end
