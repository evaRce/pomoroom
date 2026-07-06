defmodule Pomoroom.LiveKit.RoomCache do
  @moduledoc """
  Tracks which LiveKit rooms we've already confirmed exist (with the
  participant cap applied), so `Pomoroom.LiveKit.ensure_room/1` only has to
  hit the Room Service API once per room instead of on every join.
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

  @spec mark_ensured(String.t()) :: :ok
  def mark_ensured(chat_id) do
    :ets.insert(@table, {chat_id})
    :ok
  end

  @impl true
  def init(_opts) do
    :ets.new(@table, [:named_table, :public, :set, read_concurrency: true])
    {:ok, %{}}
  end
end