defmodule Pomoroom.LiveKit do
  @moduledoc """
  Generates LiveKit access tokens so the frontend can join a call room
  without the backend having to handle any WebRTC signaling.
  """

  require Logger

  alias Livekit.AccessToken
  alias Livekit.Grants
  alias Livekit.RoomServiceClient

  @token_ttl_seconds 3600
  @max_call_participants 10
  @room_cache_ttl_ms 15_000

  @doc """
  Builds a signed JWT that grants `nickname` access to join the call room for `chat_id` on LiveKit.
  """
  def generate_token(nickname, chat_id) do
    config = Application.fetch_env!(:pomoroom, :livekit)

    AccessToken.new(config[:api_key], config[:api_secret])
    # LiveKit's "identity" is our nickname
    |> AccessToken.with_identity(nickname)
    |> AccessToken.with_ttl(@token_ttl_seconds)
    |> AccessToken.add_grant(Grants.join_room(chat_id))
    |> AccessToken.to_jwt()
  end

  @doc """
  Ensures a LiveKit room exists for `chat_id`, with the participant cap applied.

  A cache hit is re-confirmed against LiveKit once it's older than
  `@room_cache_ttl_ms`, since LiveKit deletes empty rooms and can silently
  recreate them uncapped. Always returns `:ok` immediately (non-blocking).
  """
  def ensure_room(chat_id) do
    Task.start(fn -> ensure_room_exists(chat_id) end)
    :ok
  end

  defp ensure_room_exists(chat_id) do
    if Pomoroom.LiveKit.RoomCache.fresh?(chat_id, @room_cache_ttl_ms) do
      :ok
    else
      if Pomoroom.LiveKit.RoomCache.ensured?(chat_id) and room_still_capped?(chat_id) do
        Pomoroom.LiveKit.RoomCache.mark_ensured(chat_id)
      else
        create_room(chat_id)
      end
    end
  end

  defp room_still_capped?(chat_id) do
    client = livekit_client()

    case RoomServiceClient.list_rooms(client, [chat_id]) do
      {:ok, %{rooms: [room]}} ->
        room.max_participants == @max_call_participants

      {:ok, %{rooms: []}} ->
        false

      {:error, reason} ->
        Logger.warning("Could not verify LiveKit room #{chat_id}: #{inspect(reason)}")
        true
    end
  end

  defp create_room(chat_id) do
    client = livekit_client()

    case RoomServiceClient.create_room(client, chat_id, max_participants: @max_call_participants) do
      {:ok, room} when room.max_participants == @max_call_participants ->
        Pomoroom.LiveKit.RoomCache.mark_ensured(chat_id)

      {:ok, room} ->
        Logger.error(
          "LiveKit room #{chat_id} exists without the expected participant cap " <>
            "(got #{room.max_participants}, wanted #{@max_call_participants}) and " <>
            "can't be recapped after creation — it will stay uncapped for its lifetime."
        )

      {:error, reason} ->
        Logger.warning("Could not ensure LiveKit room #{chat_id}: #{inspect(reason)}")
    end
  end

  @doc """
  Returns the WebSocket URL the frontend should connect to.

  In production this is a fixed `ws_url` (LiveKit runs on its own domain
  with a real TLS certificate). In dev it's built from `host` — the same
  host the browser used to load the page — because "localhost" only means
  something on the machine running it; a phone on the same network needs
  the dev machine's LAN address instead.
  """
  def ws_url(host) do
    config = Application.fetch_env!(:pomoroom, :livekit)

    case config[:ws_url] do
      nil -> "wss://#{host}:#{config[:ws_port]}"
      static_url -> static_url
    end
  end

  defp livekit_client do
    config = Application.fetch_env!(:pomoroom, :livekit)
    RoomServiceClient.new(config[:admin_url], config[:api_key], config[:api_secret])
  end
end
