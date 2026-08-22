defmodule PomoroomWeb.ChatLive.ChatRoom.Calls do
  import PomoroomWeb.ChatLive.ChatRoom.ReactEvent

  def handle_join_room(socket, chat_id, user) do
    if MapSet.member?(socket.assigns.subscribed_chat_ids, chat_id) do
      Pomoroom.LiveKit.ensure_room(chat_id)
      token = Pomoroom.LiveKit.generate_token(user.nickname, chat_id)
      ws_url = Pomoroom.LiveKit.ws_url(socket.host_uri.host)

      notify_react(socket, "livekit_token", %{token: token, ws_url: ws_url, chat_id: chat_id})
    else
      {:noreply, socket}
    end
  end
end
