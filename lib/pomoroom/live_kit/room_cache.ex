defmodule Pomoroom.LiveKit.RoomCache do
  @moduledoc """
  Tracks which LiveKit rooms we've already confirmed exist (with the
  participant cap applied), along with when that was last confirmed.

  LiveKit deletes empty rooms and can silently recreate them uncapped, so
  `Pomoroom.LiveKit.ensure_room/1` only trusts a cache hit while it's fresh
  (see `fresh?/2`) and re-confirms against LiveKit once it goes stale,
  instead of hitting the Room Service API on every single join.
  """

  use GenServer

  @table __MODULE__

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @spec ensured?(String.t()) :: boolean()
  def ensured?(chat_id) do
    :ets.member(@table, chat_id)
  end

  @spec fresh?(String.t(), non_neg_integer()) :: boolean()
  def fresh?(chat_id, max_age_ms) do
    case :ets.lookup(@table, chat_id) do
      [{^chat_id, confirmed_at}] -> System.monotonic_time(:millisecond) - confirmed_at < max_age_ms
      [] -> false
    end
  end

  @spec mark_ensured(String.t()) :: :ok
  def mark_ensured(chat_id) do
    :ets.insert(@table, {chat_id, System.monotonic_time(:millisecond)})
    :ok
  end

  @impl true
  def init(_opts) do
    :ets.new(@table, [:named_table, :public, :set, read_concurrency: true])
    {:ok, %{}}
  end
end