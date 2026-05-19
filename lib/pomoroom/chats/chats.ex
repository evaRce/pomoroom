defmodule Pomoroom.Chats do
  alias Pomoroom.Chats.ChatService

  defdelegate generate_chat_id(), to: ChatService
  defdelegate delete_chat(collection, chat_id), to: ChatService
  defdelegate exists?(chat_id), to: ChatService
  defdelegate get_all_group_chats_data(user), to: ChatService
  defdelegate get_all_chats_id(user), to: ChatService
  defdelegate timestamps(changeset), to: ChatService
end