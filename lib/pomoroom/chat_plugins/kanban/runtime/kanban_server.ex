defmodule Pomoroom.ChatPlugins.Kanban.Runtime.KanbanServer do
  use GenServer

  alias Pomoroom.ChatPlugins.Kanbans

  def start_link(%{chat_id: chat_id, chat_type: chat_type, kanban_id: kanban_id} = args) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(chat_id, chat_type, kanban_id))
  end

  def via_tuple(chat_id, chat_type, kanban_id) do
    process_id = "kanban:#{chat_type}:#{chat_id}:#{kanban_id}"
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
end
