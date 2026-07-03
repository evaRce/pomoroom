defmodule Pomoroom.LiveKit do
  @moduledoc """
  Generates LiveKit access tokens so the frontend can join a call room
  without the backend having to handle any WebRTC signaling.
  """

  alias Livekit.AccessToken
  alias Livekit.Grants

  @token_ttl_seconds 3600

  @doc """
  Builds a signed JWT that grants `nickname` access to join the call room for `chat_id` on LiveKit.
  """
  def generate_token(nickname, chat_id) do
    config = Application.fetch_env!(:pomoroom, :livekit)

    AccessToken.new(config[:api_key], config[:api_secret])
    |> AccessToken.with_identity(nickname)
    |> AccessToken.with_ttl(@token_ttl_seconds)
    |> AccessToken.add_grant(Grants.join_room(chat_id))
    |> AccessToken.to_jwt()
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
