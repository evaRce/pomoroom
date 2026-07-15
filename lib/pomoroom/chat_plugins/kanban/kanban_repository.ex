defmodule Pomoroom.ChatPlugins.Kanban.KanbanRepository do
  alias Pomoroom.ChatPlugins.Kanban.KanbanTaskSchema

  @board_collection "kanban_boards"
  @task_collection "kanban_tasks"

  def create_board(kanban_board) do
    board = board_changes(kanban_board)

    case Mongo.insert_one(:mongo, @board_collection, board) do
      {:ok, _result} ->
        {:ok, board}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get_board_by_kanban_id(kanban_id) do
    case Mongo.find_one(:mongo, @board_collection, %{"kanban_id" => kanban_id}) do
      nil -> {:error, :not_found}
      board -> {:ok, board_changes(board)}
    end
  end

  def update_board_if_version_matches(kanban_id, columns, expected_board_version) do
    next_board_version = expected_board_version + 1

    query =
      if expected_board_version == 0 do
        %{
          "$or" => [
            %{"kanban_id" => kanban_id, "board_version" => 0},
            %{"kanban_id" => kanban_id, "board_version" => %{"$exists" => false}}
          ]
        }
      else
        %{"kanban_id" => kanban_id, "board_version" => expected_board_version}
      end

    set_data = %{
      columns: normalized_columns(columns),
      board_version: next_board_version
    }

    case Mongo.find_one_and_update(
           :mongo,
           @board_collection,
           query,
           %{"$set" => set_data},
           return_document: :after
         ) do
      {:ok, %Mongo.FindAndModifyResult{value: nil}} ->
        {:error, :version_conflict}

      {:ok, %Mongo.FindAndModifyResult{value: updated_board}} when is_map(updated_board) ->
        {:ok, board_changes(updated_board)}

      {:error, _reason} ->
        {:error, :failed_to_persist_board}
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

  def get_tasks_by_ids(task_ids) do
    query = %{
      task_id: %{"$in" => task_ids}
    }

    tasks =
      Mongo.find(:mongo, "kanban_tasks", query)
      |> Enum.to_list()
      |> Enum.map(&task_changes/1)

    {:ok, tasks}
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

  def delete_all_boards() do
    Mongo.delete_many(:mongo, @board_collection, %{})
  end

  def delete_all_tasks() do
    Mongo.delete_many(:mongo, @task_collection, %{})
  end

  defp board_changes(args) do
    kanban_id = Map.get(args, :kanban_id) || Map.get(args, "kanban_id")
    columns = Map.get(args, :columns) || Map.get(args, "columns") || []

    %{
      kanban_id: kanban_id,
      columns: normalized_columns(columns),
      board_version: get_board_version(args)
    }
  end

  defp normalized_columns(columns) do
    Enum.map(columns, fn column ->
      %{
        column_id: Map.get(column, :column_id) || Map.get(column, "column_id"),
        title: Map.get(column, :title) || Map.get(column, "title"),
        task_ids: Map.get(column, :task_ids) || Map.get(column, "task_ids") || []
      }
    end)
  end

  defp get_board_version(args) do
    value = Map.get(args, :board_version) || Map.get(args, "board_version")

    case value do
      version when is_integer(version) and version >= 0 -> version
      _ -> 0
    end
  end

  defp task_changes(args) do
    KanbanTaskSchema.kanban_task_changeset(args).changes
  end
end
