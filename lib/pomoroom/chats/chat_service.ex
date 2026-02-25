defmodule Pomoroom.Chats.ChatService do
  alias Pomoroom.Chats.ChatRepository
  alias Pomoroom.GroupChats
  import Ecto.Changeset

  @max_num 100_000

  def get_public_id_chat() do
    :rand.uniform(@max_num)
    |> Integer.to_string()
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
    {:ok, group_chats_id} = ChatRepository.get_chat_ids("group_chats", user)
    {:ok, private_chats_id} = ChatRepository.get_chat_ids("private_chats", user)
    group_chats_id ++ private_chats_id
  end

  def timestamps(changeset) do
    change(changeset, %{inserted_at: NaiveDateTime.utc_now(), updated_at: NaiveDateTime.utc_now()})
  end
end