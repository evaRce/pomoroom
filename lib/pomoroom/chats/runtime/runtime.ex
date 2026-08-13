defmodule Pomoroom.Chats.Runtime.Runtime do
  alias Pomoroom.Chats.Runtime.ChatServer

  def ensure_chat_server_exists(chat_id) do
    case Registry.lookup(Registry.Chat, chat_id) do
      [] ->
        DynamicSupervisor.start_child(Pomoroom.Chats.ChatSupervisor, {ChatServer, chat_id})
        :ok

      [_process] ->
        :ok
    end
  end
end
