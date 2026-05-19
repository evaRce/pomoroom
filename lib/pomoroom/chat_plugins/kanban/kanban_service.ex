defmodule Pomoroom.ChatPlugins.Kanban.KanbanService do
  alias Pomoroom.ChatPlugins.Kanban.{
    ColumnSchema,
    KanbanRepository,
    KanbanBoardSchema,
    KanbanTaskSchema
  }

  def create_kanban_board() do
    kanban_id = KanbanBoardSchema.generate_kanban_id()

    board = %{
      kanban_id: kanban_id,
      columns: []
    }

    case KanbanRepository.create_board(board) do
      {:ok, _result} -> {:ok, board}
      {:error, reason} -> {:error, reason}
    end
  end

  def get_board(kanban_id) do
    case valid_identifier?(kanban_id) do
      true -> KanbanRepository.get_board_by_kanban_id(kanban_id)
      false -> {:error, :invalid_kanban_id}
    end
  end

  def add_column(kanban_id, title) do
    case valid_identifier?(kanban_id) and valid_identifier?(title) do
      true ->
        case KanbanRepository.get_board_by_kanban_id(kanban_id) do
          {:ok, board} ->
            column = %{
              column_id: ColumnSchema.generate_column_id(),
              title: title,
              task_ids: []
            }

            updated_board = Map.put(board, :columns, board_columns(board) ++ [column])

            case KanbanRepository.update_board(updated_board) do
              {:ok, _result} -> {:ok, updated_board}
              {:error, reason} -> {:error, reason}
            end

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def remove_column(kanban_id, column_id) do
    case valid_identifier?(kanban_id) and valid_identifier?(column_id) do
      true ->
        case KanbanRepository.get_board_by_kanban_id(kanban_id) do
          {:ok, board} ->
            columns = board_columns(board)

            case find_column(columns, column_id) do
              nil ->
                {:error, :not_found}

              column ->
                remaining_columns =
                  Enum.reject(columns, fn item -> column_id_from_column(item) == column_id end)

                updated_board = Map.put(board, :columns, remaining_columns)

                case KanbanRepository.update_board(updated_board) do
                  {:ok, _result} ->
                    case delete_tasks(task_ids_from_column(column)) do
                      :ok -> {:ok, updated_board}
                      {:error, reason} -> {:error, reason}
                    end

                  {:error, reason} ->
                    {:error, reason}
                end
            end

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def add_task(kanban_id, column_id, title) do
    case valid_identifier?(kanban_id) and valid_identifier?(column_id) and
           valid_identifier?(title) do
      true ->
        case KanbanRepository.get_board_by_kanban_id(kanban_id) do
          {:ok, board} ->
            columns = board_columns(board)

            case find_column(columns, column_id) do
              nil ->
                {:error, :not_found}

              column ->
                task_id = KanbanTaskSchema.generate_task_id()
                task_ids = task_ids_from_column(column)
                order_in_column = length(task_ids)

                task = %{
                  task_id: task_id,
                  kanban_id: kanban_id,
                  column_id: column_id,
                  title: title,
                  order_in_column: order_in_column
                }

                case KanbanRepository.create_task(task) do
                  {:ok, _result} ->
                    updated_columns =
                      replace_column_task_ids(columns, column_id, task_ids ++ [task_id])

                    updated_board = Map.put(board, :columns, updated_columns)

                    case KanbanRepository.update_board(updated_board) do
                      {:ok, _board_result} ->
                        {:ok, task}

                      {:error, reason} ->
                        _ = KanbanRepository.delete_task(task_id)
                        {:error, reason}
                    end

                  {:error, reason} ->
                    {:error, reason}
                end
            end

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def move_task(task_id, from_column_id, to_column_id, new_position) do
    case valid_identifier?(task_id) and valid_identifier?(from_column_id) and
           valid_identifier?(to_column_id) do
      true ->
        case valid_position?(new_position) do
          true ->
            case from_column_id == to_column_id do
              true ->
                reorder_task(task_id, to_column_id, new_position)

              false ->
                case KanbanRepository.get_task_by_task_id(task_id) do
                  {:ok, task} ->
                    case KanbanRepository.get_board_by_kanban_id(task.kanban_id) do
                      {:ok, board} ->
                        move_task_between_columns(
                          board,
                          task,
                          from_column_id,
                          to_column_id,
                          new_position
                        )

                      {:error, reason} ->
                        {:error, reason}
                    end

                  {:error, reason} ->
                    {:error, reason}
                end
            end

          false ->
            {:error, :invalid_position}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def reorder_task(task_id, column_id, new_position) do
    case valid_identifier?(task_id) and valid_identifier?(column_id) do
      true ->
        case valid_position?(new_position) do
          true ->
            case KanbanRepository.get_task_by_task_id(task_id) do
              {:ok, task} ->
                case KanbanRepository.get_board_by_kanban_id(task.kanban_id) do
                  {:ok, board} ->
                    reorder_task_in_column(board, task, column_id, new_position)

                  {:error, reason} ->
                    {:error, reason}
                end

              {:error, reason} ->
                {:error, reason}
            end

          false ->
            {:error, :invalid_position}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def delete_board(kanban_id) do
    KanbanRepository.delete_board(kanban_id)
  end

  def get_task(task_id) do
    case valid_identifier?(task_id) do
      true -> KanbanRepository.get_task_by_task_id(task_id)
      false -> {:error, :invalid_task_id}
    end
  end

  defp move_task_between_columns(board, task, from_column_id, to_column_id, new_position) do
    columns = board_columns(board)
    from_column = find_column(columns, from_column_id)
    to_column = find_column(columns, to_column_id)

    case from_column == nil or to_column == nil do
      true ->
        {:error, :not_found}

      false ->
        from_task_ids = task_ids_from_column(from_column)
        to_task_ids = task_ids_from_column(to_column)

        case Enum.member?(from_task_ids, task.task_id) do
          true ->
            updated_from_ids = Enum.reject(from_task_ids, fn id -> id == task.task_id end)
            inserted_to_ids = insert_task_id(to_task_ids, task.task_id, new_position)

            updated_columns =
              columns
              |> replace_column_task_ids(from_column_id, updated_from_ids)
              |> replace_column_task_ids(to_column_id, inserted_to_ids)

            updated_board = Map.put(board, :columns, updated_columns)

            case KanbanRepository.update_board(updated_board) do
              {:ok, _result} ->
                case update_column_tasks_order(from_column_id, updated_from_ids) do
                  :ok ->
                    case update_column_tasks_order(to_column_id, inserted_to_ids) do
                      :ok ->
                        updated_task =
                          Map.put(task, :column_id, to_column_id)
                          |> Map.put(
                            :order_in_column,
                            task_position(inserted_to_ids, task.task_id)
                          )

                        case KanbanRepository.update_task(updated_task) do
                          {:ok, _task_result} -> {:ok, updated_task}
                          {:error, reason} -> {:error, reason}
                        end

                      {:error, reason} ->
                        {:error, reason}
                    end

                  {:error, reason} ->
                    {:error, reason}
                end

              {:error, reason} ->
                {:error, reason}
            end

          false ->
            {:error, :not_found}
        end
    end
  end

  defp reorder_task_in_column(board, task, column_id, new_position) do
    columns = board_columns(board)

    case find_column(columns, column_id) do
      nil ->
        {:error, :not_found}

      column ->
        current_task_ids = task_ids_from_column(column)

        case Enum.member?(current_task_ids, task.task_id) do
          true ->
            remaining_task_ids = Enum.reject(current_task_ids, fn id -> id == task.task_id end)
            reordered_task_ids = insert_task_id(remaining_task_ids, task.task_id, new_position)

            updated_columns = replace_column_task_ids(columns, column_id, reordered_task_ids)
            updated_board = Map.put(board, :columns, updated_columns)

            case KanbanRepository.update_board(updated_board) do
              {:ok, _result} ->
                case update_column_tasks_order(column_id, reordered_task_ids) do
                  :ok ->
                    updated_task =
                      Map.put(task, :column_id, column_id)
                      |> Map.put(
                        :order_in_column,
                        task_position(reordered_task_ids, task.task_id)
                      )

                    case KanbanRepository.update_task(updated_task) do
                      {:ok, _task_result} -> {:ok, updated_task}
                      {:error, reason} -> {:error, reason}
                    end

                  {:error, reason} ->
                    {:error, reason}
                end

              {:error, reason} ->
                {:error, reason}
            end

          false ->
            {:error, :not_found}
        end
    end
  end

  defp update_column_tasks_order(column_id, task_ids) do
    Enum.reduce_while(Enum.with_index(task_ids), :ok, fn {current_task_id, position}, :ok ->
      case KanbanRepository.get_task_by_task_id(current_task_id) do
        {:ok, task} ->
          updated_task =
            task
            |> Map.put(:column_id, column_id)
            |> Map.put(:order_in_column, position)

          case KanbanRepository.update_task(updated_task) do
            {:ok, _result} -> {:cont, :ok}
            {:error, reason} -> {:halt, {:error, reason}}
          end

        {:error, reason} ->
          {:halt, {:error, reason}}
      end
    end)
  end

  defp delete_tasks(task_ids) do
    Enum.reduce_while(task_ids, :ok, fn task_id, :ok ->
      case KanbanRepository.delete_task(task_id) do
        {:ok, _result} -> {:cont, :ok}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  defp insert_task_id(task_ids, task_id, new_position) do
    safe_position = clamp_position(new_position, length(task_ids))
    List.insert_at(task_ids, safe_position, task_id)
  end

  defp clamp_position(position, _length) when position < 0, do: 0
  defp clamp_position(position, length) when position > length, do: length
  defp clamp_position(position, _length), do: position

  defp task_position(task_ids, task_id) do
    case Enum.find_index(task_ids, fn id -> id == task_id end) do
      nil -> 0
      position -> position
    end
  end

  defp board_columns(board) do
    Map.get(board, :columns) || Map.get(board, "columns") || []
  end

  defp find_column(columns, column_id) do
    Enum.find(columns, fn column -> column_id_from_column(column) == column_id end)
  end

  defp replace_column_task_ids(columns, column_id, task_ids) do
    Enum.map(columns, fn column ->
      case column_id_from_column(column) == column_id do
        true -> Map.put(column, :task_ids, task_ids)
        false -> column
      end
    end)
  end

  defp task_ids_from_column(column) do
    Map.get(column, :task_ids) || Map.get(column, "task_ids") || []
  end

  defp column_id_from_column(column) do
    Map.get(column, :column_id) || Map.get(column, "column_id")
  end

  defp valid_identifier?(value) do
    is_binary(value) and value != ""
  end

  defp valid_position?(value) do
    is_integer(value)
  end
end
