defmodule PomoroomWeb.ChatLive.ChatRoom.Calls do
  import Phoenix.Component, only: [assign: 3]
  import Phoenix.LiveView, only: [push_event: 3]

  alias Phoenix.PubSub
  alias Pomoroom.FriendRequests
  alias Pomoroom.PrivateChats
  alias PomoroomWeb.Presence

  def handle_request_offers(socket, request_from_user) do
    IO.inspect(socket.assigns.connected_users,
      label:
        "[#{socket.assigns.user_info.nickname}](PASO3){handle_info(:added_connected_users)} le llega oferta del sender"
    )

    new_offer_request = socket.assigns.offer_requests ++ [request_from_user]

    socket =
      socket
      |> assign(:offer_requests, new_offer_request)

    payload = %{
      event_name: "offer_requests",
      event_data: %{offer_requests: new_offer_request}
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_presence_diff(socket, topic, nickname, chat_id) do
    connected_users = list_present(call_topic(chat_id))
    IO.inspect(connected_users, label: "[#{nickname}]LIST PRESENT: ")

    IO.inspect(
      "[#{nickname}](PASO2){push_event('connected_users')} entra en el Broadcast (topic: #{topic}) (connected_users: #{connected_users})"
    )

    payload_to_client = %{
      event_name: "connected_users",
      event_data: %{connected_users: connected_users}
    }

    {:noreply, push_event(socket, "react", payload_to_client)}
  end

  def handle_new_ice_candidate_info(socket, payload) do
    receive_ice_candidate_offers = socket.assigns.ice_candidate_offers ++ [payload]
    IO.inspect("[#{socket.assigns.user_info.nickname}](PASO4.3)receive_ice_candidate_offers")

    socket =
      socket
      |> assign(:ice_candidate_offers, receive_ice_candidate_offers)

    payload = %{
      event_name: "receive_ice_candidate_offers",
      event_data: %{ice_candidate_offers: receive_ice_candidate_offers}
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_new_sdp_offer_info(socket, payload) do
    receive_sdp_offers = socket.assigns.ice_candidate_offers ++ [payload]
    IO.inspect("[#{socket.assigns.user_info.nickname}](PASO5)receive_sdp_offers")

    socket =
      socket
      |> assign(:sdp_offers, receive_sdp_offers)

    payload = %{
      event_name: "receive_sdp_offers",
      event_data: %{sdp_offer: receive_sdp_offers}
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_new_answer_info(socket, payload) do
    receive_answers = socket.assigns.answers ++ [payload]
    IO.inspect("[#{socket.assigns.user_info.nickname}](PASO3prima)receive_answers")

    socket =
      socket
      |> assign(:answers, receive_answers)

    payload = %{
      event_name: "receive_answers",
      event_data: %{answers: receive_answers}
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  def handle_start_private_call(socket, to_user, from_user, chat_id) do
    socket = call(to_user, from_user.nickname, socket)
    connected_users = socket.assigns.connected_users

    IO.inspect(
      connected_users,
      label: "[#{from_user.nickname}](PASO 1.2){action.start_private_call} -> connected_users: ["
    )

    Enum.with_index(connected_users)
    |> Enum.each(fn {connected_user, index} ->
      IO.inspect(
        "[#{from_user.nickname}](PASO 1.3){bucle} enviar mensaje a #{connected_user} la i = #{index + 1}"
      )

      send_direct_message(
        chat_id,
        connected_user,
        :request_offers,
        %{
          from_user: from_user.nickname
        },
        from_user.nickname
      )
    end)

    {:noreply, socket}
  end

  def handle_new_ice_candidate_event(socket, payload, to_user, from_user, chat_id) do
    IO.inspect("[#{socket.assigns.user_info.nickname}](PASO-4x){LLEGO action.new_ice_candidate}")
    payload = Map.merge(payload, %{"from_user" => from_user.nickname})

    send_direct_message(
      chat_id,
      to_user,
      :new_ice_candidate,
      payload,
      socket.assigns.user_info.nickname
    )

    {:noreply, socket}
  end

  def handle_new_sdp_offer_event(socket, payload, to_user, from_user, chat_id) do
    IO.inspect(
      "[#{from_user.nickname}](PASO-3x){LLEGO action.new_sdp_offer enviar a -> #{to_user}}"
    )

    payload = Map.merge(payload, %{"from_user" => from_user.nickname})

    send_direct_message(chat_id, to_user, :new_sdp_offer, payload, from_user.nickname)
    {:noreply, socket}
  end

  def handle_new_answer_event(socket, payload, to_user, from_user, chat_id) do
    IO.inspect("[#{socket.assigns.user_info.nickname}](PASO-5x){LLEGO action.new_answer}")
    payload = Map.merge(payload, %{"from_user" => from_user.nickname})

    send_direct_message(chat_id, to_user, :new_answer, payload, socket.assigns.user_info.nickname)
    {:noreply, socket}
  end

  def handle_end_private_call(socket, from_user, chat_id) do
    PubSub.unsubscribe(Pomoroom.PubSub, call_topic(chat_id))
    PubSub.unsubscribe(Pomoroom.PubSub, call_topic(chat_id) <> ":" <> from_user.nickname)
    Presence.untrack(self(), call_topic(chat_id), from_user.nickname)

    {:noreply, reset_call_state(socket)}
  end

  def reset_call_state(socket) do
    socket
    |> assign(:chat_id, "")
    |> assign(:connected_users, [])
    |> assign(:offer_requests, [])
    |> assign(:ice_candidate_offers, [])
    |> assign(:sdp_offers, [])
    |> assign(:answers, [])
  end

  defp list_present(call_topic) do
    Presence.list(call_topic)
    |> Enum.map(fn {nickname, _} -> nickname end)
  end

  defp call_topic(chat_id), do: "call:#{chat_id}"

  defp call(to_user, from_user, socket) do
    {to_nickname_request, from_nickname_request_} =
      FriendRequests.determine_friend_request_users(to_user, from_user)

    case PrivateChats.get(to_nickname_request, from_nickname_request_) do
      {:ok, private_chat} ->
        IO.inspect("[#{from_user}](PASO 1.1){suscribe, track}")
        chat_id = private_chat.chat_id
        PubSub.subscribe(Pomoroom.PubSub, call_topic(chat_id))
        PubSub.subscribe(Pomoroom.PubSub, call_topic(chat_id) <> ":" <> from_user)

        case Presence.track(self(), call_topic(chat_id), from_user, %{}) do
          {:ok, _ref} ->
            connected_users = list_present(call_topic(chat_id))
            IO.inspect(connected_users, label: "[#{from_user}]Connected: ")

            socket
            |> assign(:chat_id, chat_id)
            |> assign(:connected_users, connected_users)

          {:error, _reason} ->
            socket
        end

      {:error, _reason} ->
        socket
    end
  end

  defp send_direct_message(chat_id, to_user, event, payload, from_user) do
    topic = call_topic(chat_id) <> ":" <> to_user

    IO.inspect("[#{from_user}](PASO 1.3.1){bucle1} topico= #{topic}")

    PubSub.broadcast_from(
      Pomoroom.PubSub,
      self(),
      topic,
      {event, payload}
    )
    |> IO.inspect(label: "PUBSUB: ")
  end
end
