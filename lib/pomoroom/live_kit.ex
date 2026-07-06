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
  Ensures a LiveKit room exists for the given `chat_id`.

  - If already ensured (cached), does nothing.
  - Otherwise, triggers room creation in a background process.

  Always returns `:ok` immediately (non-blocking). If the Room Service API
  fails, the room may still be auto-created on first participant join.
  """
  def ensure_room(chat_id) do
    if Pomoroom.LiveKit.RoomCache.ensured?(chat_id) do
      :ok
    else
      Task.start(fn -> create_room(chat_id) end)
      :ok
    end
  end

  defp create_room(chat_id) do
    config = Application.fetch_env!(:pomoroom, :livekit)
    admin_url = config[:admin_url]

    client = RoomServiceClient.new(admin_url, config[:api_key], config[:api_secret])

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
end
