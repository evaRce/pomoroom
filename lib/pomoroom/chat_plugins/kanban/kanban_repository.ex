defmodule Pomoroom.ChatPlugins.Kanban.KanbanRepository do
  alias Pomoroom.ChatPlugins.Kanban.{KanbanBoardSchema, KanbanTaskSchema}

  @board_collection "kanban_boards"
  @task_collection "kanban_tasks"

  def create_board(kanban_board) do
    Mongo.insert_one(:mongo, @board_collection, board_changes(kanban_board))
  end

  def get_board_by_kanban_id(kanban_id) do
    case Mongo.find_one(:mongo, @board_collection, %{"kanban_id" => kanban_id}) do
      nil ->
        {:error, :not_found}

      board when is_map(board) ->
        {:ok, board_changes(board)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def update_board(kanban_board) do
    board = board_changes(kanban_board)

    case Mongo.update_one(
           :mongo,
           @board_collection,
           %{"kanban_id" => board.kanban_id},
           %{"$set" => Map.delete(board, :kanban_id)}
         ) do
      {:ok, %Mongo.UpdateResult{matched_count: 0}} ->
        {:error, :not_found}

      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_board(kanban_id) do
    case Mongo.delete_one(:mongo, @board_collection, %{"kanban_id" => kanban_id}) do
      {:ok, %Mongo.DeleteResult{deleted_count: 0}} ->
        {:error, :not_found}

      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def create_task(task) do
    Mongo.insert_one(:mongo, @task_collection, task_changes(task))
  end

  def get_task_by_task_id(task_id) do
    case Mongo.find_one(:mongo, @task_collection, %{"task_id" => task_id}) do
      nil ->
        {:error, :not_found}

      task when is_map(task) ->
        {:ok, task_changes(task)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def update_task(task) do
    changes = task_changes(task)

    case Mongo.update_one(
           :mongo,
           @task_collection,
           %{"task_id" => changes.task_id},
           %{"$set" => Map.delete(changes, :task_id)}
         ) do
      {:ok, %Mongo.UpdateResult{matched_count: 0}} ->
        {:error, :not_found}

      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_task(task_id) do
    case Mongo.delete_one(:mongo, @task_collection, %{"task_id" => task_id}) do
      {:ok, %Mongo.DeleteResult{deleted_count: 0}} ->
        {:error, :not_found}

      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp board_changes(args) do
    KanbanBoardSchema.kanban_board_changeset(args).changes
  end

  defp task_changes(args) do
    KanbanTaskSchema.kanban_task_changeset(args).changes
  end
end
