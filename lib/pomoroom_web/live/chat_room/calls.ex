defmodule PomoroomWeb.ChatLive.ChatRoom.Calls do
  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView, only: [push_event: 3]

  alias Phoenix.PubSub
  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats
  alias PomoroomWeb.Presence

  def handle_join_room(socket, to_user_arg, from_user_arg) do
    from_nickname = from_user_arg.nickname

    {to_user, from_user} =
      FriendRequests.determine_friend_request_users(to_user_arg, from_nickname)

    case PrivateChats.get(to_user, from_user) do
      {:ok, %{chat_id: chat_id}} ->
        PubSub.subscribe(Pomoroom.PubSub, call_topic(chat_id))
        PubSub.subscribe(Pomoroom.PubSub, call_topic(chat_id) <> ":" <> from_nickname)
        Presence.track(self(), call_topic(chat_id), from_nickname, %{})
        {:noreply, assign(socket, :call_chat_id, chat_id)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_leave_room(socket, from_user) do
    chat_id = socket.assigns.call_chat_id
    from_nickname = from_user.nickname

    PubSub.unsubscribe(Pomoroom.PubSub, call_topic(chat_id))
    PubSub.unsubscribe(Pomoroom.PubSub, call_topic(chat_id) <> ":" <> from_nickname)
    Presence.untrack(self(), call_topic(chat_id), from_nickname)

    {:noreply, assign(socket, :call_chat_id, nil)}
  end

  def handle_presence_diff(socket) do
    chat_id = socket.assigns.call_chat_id

    if is_nil(chat_id) or chat_id == "" do
      {:noreply, socket}
    else
      room_users = list_present(call_topic(chat_id))

      {:noreply,
       push_event(socket, "react", %{
         event_name: "room_users",
         event_data: %{room_users: room_users}
       })}
    end
  end

  def relay_to_user(socket, to_user, event_name, payload, _from_user) do
    chat_id = socket.assigns.call_chat_id
    topic = call_topic(chat_id) <> ":" <> to_user

    PubSub.broadcast(Pomoroom.PubSub, topic, {String.to_atom(event_name), payload})
    {:noreply, socket}
  end

  def reset_call_state(socket) do
    assign(socket, :call_chat_id, nil)
  end

  defp list_present(topic) do
    Presence.list(topic) |> Enum.map(fn {nickname, _} -> nickname end)
  end

  defp call_topic(chat_id), do: "call:#{chat_id}"
end
