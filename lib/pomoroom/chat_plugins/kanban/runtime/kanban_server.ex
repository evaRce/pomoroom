defmodule Pomoroom.ChatPlugins.Kanban.Runtime.KanbanServer do
  use GenServer

  alias Phoenix.PubSub
  alias Pomoroom.ChatPlugins.Kanban.Kanbans

  def start_link(%{process_id: process_id} = args) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(process_id))
  end

  def add_column_kanban(process_id, title) do
    GenServer.call(via_tuple(process_id), {:add_column, title})
  end

  def rename_column_kanban(process_id, column_id, title) do
    GenServer.call(via_tuple(process_id), {:rename_column, column_id, title})
  end

  def remove_column_kanban(process_id, column_id) do
    GenServer.call(via_tuple(process_id), {:remove_column, column_id})
  end

  def add_task_kanban(process_id, column_id, title) do
    GenServer.call(via_tuple(process_id), {:add_task, column_id, title})
  end

  def move_task_kanban(process_id, task_id, from_column_id, to_column_id, new_position) do
    GenServer.call(via_tuple(process_id), {:move_task, task_id, from_column_id, to_column_id, new_position})
  end

  def reorder_task_kanban(process_id, task_id, column_id, new_position) do
    GenServer.call(via_tuple(process_id), {:reorder_task, task_id, column_id, new_position})
  end

  def rename_task_kanban(process_id, task_id, title) do
    GenServer.call(via_tuple(process_id), {:rename_task, task_id, title})
  end

  def delete_task_kanban(process_id, task_id) do
    GenServer.call(via_tuple(process_id), {:delete_task, task_id})
  end

  def via_tuple(process_id) do
    {:via, Registry, {Registry.KanbanPluginBoard, process_id}}
  end

  @impl true
  def init(%{chat_id: chat_id, chat_type: chat_type, kanban_id: kanban_id}) do
    state = %{
      chat_id: chat_id,
      chat_type: chat_type,
      kanban_id: kanban_id,
      board: %{}
    }

    {:ok, maybe_load_persisted_board(state)}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, {:ok, state.board}, state}
  end

  @impl true
  def handle_call({:add_column, title}, _from, state) do
    case Kanbans.add_column(state.kanban_id, title) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_column_added)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:rename_column, column_id, title}, _from, state) do
    case Kanbans.rename_column(state.kanban_id, column_id, title) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_column_renamed)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:remove_column, column_id}, _from, state) do
    case Kanbans.remove_column(state.kanban_id, column_id) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_column_removed)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:add_task, column_id, title}, _from, state) do
    case Kanbans.add_task(state.kanban_id, column_id, title) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_task_added)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:move_task, task_id, from_column_id, to_column_id, new_position}, _from, state) do
    case Kanbans.move_task(task_id, from_column_id, to_column_id, new_position) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_task_moved)

        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:reorder_task, task_id, column_id, new_position}, _from, state) do
    case Kanbans.reorder_task(task_id, column_id, new_position) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_task_reordered)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:rename_task, task_id, title}, _from, state) do
    case Kanbans.rename_task(task_id, title) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_task_renamed)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:delete_task, task_id}, _from, state) do
    case Kanbans.delete_task(task_id) do
      {:ok, board} ->
        next_state = %{state | board: board}
        broadcast_state(next_state, :kanban_task_deleted)
        {:reply, {:ok, board}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  defp maybe_load_persisted_board(state) do
    case Kanbans.get_board(state.kanban_id) do
      {:ok, board} -> %{state | board: board}
      {:error, _reason} -> state
    end
  end

  defp broadcast_state(state, event_name) do
    PubSub.broadcast(
      Pomoroom.PubSub,
      kanban_topic(state.chat_id),
      {event_name, %{
        event_data: %{
          chat_id: state.chat_id,
          chat_type: state.chat_type,
          board: state.board
        }
      }}
    )
  end

  defp kanban_topic(chat_id) do
    "chat:#{chat_id}:kanban"
  end
end
