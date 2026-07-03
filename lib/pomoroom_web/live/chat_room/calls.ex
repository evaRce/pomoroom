defmodule PomoroomWeb.ChatLive.ChatRoom.Calls do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats

  def handle_join_room(socket, to_user_arg, from_user_arg) do
    from_nickname = from_user_arg.nickname

    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(to_user_arg, from_nickname)

    case PrivateChats.get(to_user, from_user) do
      {:ok, %{chat_id: chat_id}} ->
        token = Pomoroom.LiveKit.generate_token(from_nickname, chat_id)
        ws_url = Pomoroom.LiveKit.ws_url(socket.host_uri.host)

        {:noreply,
         push_event(socket, "react", %{
           event_name: "livekit_token",
           event_data: %{token: token, ws_url: ws_url}
         })}

      {:error, _} ->
        {:noreply, socket}
    end
  end
end
