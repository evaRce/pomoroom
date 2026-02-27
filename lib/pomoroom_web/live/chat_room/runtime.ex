defmodule PomoroomWeb.ChatLive.ChatRoom.Runtime do
  alias Pomoroom.ChatRoom.ChatServer

  def ensure_chat_server_exists(chat_id) do
    case Registry.lookup(Registry.Chat, chat_id) do
      [] ->
        DynamicSupervisor.start_child(Pomoroom.ChatRoom.ChatSupervisor, {ChatServer, chat_id})
        :ok

      [_process] ->
        :ok
    end
  end
end
