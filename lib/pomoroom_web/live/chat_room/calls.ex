defmodule PomoroomWeb.ChatLive.ChatRoom.Calls do
  import Phoenix.LiveView, only: [push_event: 3]

  def handle_join_room(socket, chat_id, from_user) do
    if MapSet.member?(socket.assigns.subscribed_chat_ids, chat_id) do
      token = Pomoroom.LiveKit.generate_token(from_user.nickname, chat_id)
      ws_url = Pomoroom.LiveKit.ws_url(socket.host_uri.host)

      {:noreply,
       push_event(socket, "react", %{
         event_name: "livekit_token",
         event_data: %{token: token, ws_url: ws_url, chat_id: chat_id}
       })}
    else
      {:noreply, socket}
    end
  end
end
