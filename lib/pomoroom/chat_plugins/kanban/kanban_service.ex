defmodule Pomoroom.ChatPlugins.Kanban.KanbanService do
  @default_columns [
    %{column_id: "todo", title: "Por hacer"},
    %{column_id: "inProgress", title: "En progreso"},
    %{column_id: "done", title: "Hecho"}
  ]

  alias Pomoroom.ChatPlugins.Kanban.{
    ColumnSchema,
    Runtime.Runtime,
    Runtime.KanbanServer,
    KanbanRepository,
    KanbanTaskSchema
  }

  alias Pomoroom.ChatPlugins.ChatPluginService
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats

  def create_kanban_board(kanban_id) do
    board = %{
      kanban_id: kanban_id,
      columns: default_columns()
    }

    case KanbanRepository.create_board(board) do
      {:ok, _result} -> {:ok, board}
      {:error, reason} -> {:error, reason}
    end
  end

  def get_board_for_chat(chat_id, chat_type) do
    case resolve_kanban_id(chat_id, chat_type) do
      nil ->
        {:error, :plugin_not_installed}

      kanban_id ->
        get_board(kanban_id)
    end
  end

  def default_columns do
    Enum.map(@default_columns, fn column -> Map.put(column, :task_ids, []) end)
  end

  def ensure_started(chat_id, chat_type) do
    case resolve_kanban_id(chat_id, chat_type) do
      nil ->
        {:error, :plugin_not_installed}

      kanban_id ->
        start_kanban_process(chat_id, chat_type, kanban_id)
    end
  end

  def start_kanban_process(chat_id, chat_type, kanban_id) do
    Runtime.ensure_kanban_process_started(
      process_id(chat_id, chat_type),
      chat_id,
      chat_type,
      kanban_id
    )
  end

  def terminate_kanban_process(chat_id, chat_type) do
    Runtime.terminate_kanban_process(process_id(chat_id, chat_type))
  end

  def delete_kanban_for_chat(chat_id, chat_type) do
    case resolve_kanban_id(chat_id, chat_type) do
      nil ->
        terminate_kanban_process(chat_id, chat_type)
        {:ok, :no_board}

      kanban_id ->
        delete_kanban_instance(kanban_id, chat_id, chat_type)
    end
  end

  def delete_kanban_instance(kanban_id, chat_id, chat_type) do
    case KanbanRepository.get_board_by_kanban_id(kanban_id) do
      {:ok, board} ->
        case delete_all_tasks_from_board(board) do
          :ok ->
            case KanbanRepository.delete_board(kanban_id) do
              {:ok, _} ->
                terminate_kanban_process(chat_id, chat_type)
                {:ok, sanitize_for_client(materialize_board(board))}

              {:error, reason} ->
                {:error, reason}
            end

          {:error, reason} ->
            {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get_board(kanban_id) do
    case valid_identifier?(kanban_id) do
      true ->
        case KanbanRepository.get_board_by_kanban_id(kanban_id) do
          {:ok, board} ->
            {:ok, sanitize_for_client(materialize_board(board))}

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_kanban_id}
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

            new_columns = board_columns(board) ++ [column]

            case KanbanRepository.update_board_if_version_matches(
                   kanban_id,
                   new_columns,
                   board.board_version
                 ) do
              {:ok, updated_board} -> {:ok, sanitize_for_client(materialize_board(updated_board))}
              {:error, reason} -> {:error, reason}
            end

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def rename_column(kanban_id, column_id, title) do
    case valid_identifier?(kanban_id) and valid_identifier?(column_id) and
           valid_identifier?(title) do
      true ->
        case KanbanRepository.get_board_by_kanban_id(kanban_id) do
          {:ok, board} ->
            new_columns = renamed_columns(board, column_id, title)

            case KanbanRepository.update_board_if_version_matches(
                   kanban_id,
                   new_columns,
                   board.board_version
                 ) do
              {:ok, updated_board} -> {:ok, materialize_board(updated_board)}
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
                  Enum.reject(columns, fn col ->
                    column_id_from_column(col) == column_id
                  end)

                case KanbanRepository.update_board_if_version_matches(
                       kanban_id,
                       remaining_columns,
                       board.board_version
                     ) do
                  {:ok, updated_board} ->
                    case delete_tasks(task_ids_from_column(column)) do
                      :ok -> {:ok, sanitize_for_client(materialize_board(updated_board))}
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

                task = %{
                  task_id: task_id,
                  kanban_id: kanban_id,
                  title: title
                }

                case KanbanRepository.create_task(task) do
                  {:ok, _result} ->
                    new_columns =
                      replace_column_task_ids(columns, column_id, task_ids ++ [task_id])

                    case KanbanRepository.update_board_if_version_matches(
                           kanban_id,
                           new_columns,
                           board.board_version
                         ) do
                      {:ok, updated_board} ->
                        {:ok, sanitize_for_client(materialize_board(updated_board))}

                      {:error, reason} ->
                        KanbanRepository.delete_task(task_id)
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

  def get_task(task_id) do
    case valid_identifier?(task_id) do
      true ->
        case KanbanRepository.get_task_by_task_id(task_id) do
          {:ok, task} -> {:ok, sanitize_for_client(task)}
          {:error, reason} -> {:error, reason}
        end

      false ->
        {:error, :invalid_task_id}
    end
  end

  def rename_task(task_id, title) do
    case valid_identifier?(task_id) and valid_identifier?(title) do
      true ->
        case KanbanRepository.get_task_by_task_id(task_id) do
          {:ok, task} ->
            case KanbanRepository.get_board_by_kanban_id(task.kanban_id) do
              {:ok, board} ->
                updated_task = Map.put(task, :title, title)

                case KanbanRepository.update_task(updated_task) do
                  {:ok, _result} -> {:ok, sanitize_for_client(materialize_board(board))}
                  {:error, reason} -> {:error, reason}
                end

              {:error, reason} ->
                {:error, reason}
            end

          {:error, reason} ->
            {:error, reason}
        end

      false ->
        {:error, :invalid_params}
    end
  end

  def delete_task(task_id) do
    case KanbanRepository.get_task_by_task_id(task_id) do
      {:ok, task} ->
        case KanbanRepository.get_board_by_kanban_id(task.kanban_id) do
          {:ok, board} ->
            new_columns = columns_without_task(board, task)

            case KanbanRepository.update_board_if_version_matches(
                   board.kanban_id,
                   new_columns,
                   board.board_version
                 ) do
              {:ok, updated_board} ->
                case KanbanRepository.delete_task(task_id) do
                  {:ok, _result} -> {:ok, materialize_board(updated_board)}
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
  end

  def apply_operation(chat_id, chat_type, operation, args) do
    case ensure_started(chat_id, chat_type) do
      {:ok, process_id} ->
        case operation do
          :add_column ->
            KanbanServer.add_column_kanban(process_id, args)

          :rename_column ->
            {column_id, title} = args
            KanbanServer.rename_column_kanban(process_id, column_id, title)

          :remove_column ->
            KanbanServer.remove_column_kanban(process_id, args)

          :add_task ->
            {column_id, title} = args
            KanbanServer.add_task_kanban(process_id, column_id, title)

          :move_task ->
            {task_id, from_column_id, to_column_id, new_position} = args

            KanbanServer.move_task_kanban(
              process_id,
              task_id,
              from_column_id,
              to_column_id,
              new_position
            )

          :reorder_task ->
            {task_id, column_id, new_position} = args
            KanbanServer.reorder_task_kanban(process_id, task_id, column_id, new_position)

          :rename_task ->
            {task_id, title} = args
            KanbanServer.rename_task_kanban(process_id, task_id, title)

          :delete_task ->
            KanbanServer.delete_task_kanban(process_id, args)
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp delete_all_tasks_from_board(board) do
    board
    |> task_ids_from_board()
    |> delete_tasks()
  end

  defp materialize_column(column, tasks_map) do
    task_ids = task_ids_from_column(column)

    tasks =
      Enum.map(task_ids, fn task_id ->
        Map.get(tasks_map, task_id)
      end)
      |> Enum.reject(fn x -> x == nil end)

    column
    |> Map.put(:tasks, tasks)
    |> Map.delete(:task_ids)
    |> Map.delete("task_ids")
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

            new_columns =
              columns
              |> replace_column_task_ids(from_column_id, updated_from_ids)
              |> replace_column_task_ids(to_column_id, inserted_to_ids)

            case KanbanRepository.update_board_if_version_matches(
                   board.kanban_id,
                   new_columns,
                   board.board_version
                 ) do
              {:ok, updated_board} ->
                {:ok, sanitize_for_client(materialize_board(updated_board))}

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

            new_columns = replace_column_task_ids(columns, column_id, reordered_task_ids)

            case KanbanRepository.update_board_if_version_matches(
                   board.kanban_id,
                   new_columns,
                   board.board_version
                 ) do
              {:ok, updated_board} ->
                {:ok, sanitize_for_client(materialize_board(updated_board))}

              {:error, reason} ->
                {:error, reason}
            end

          false ->
            {:error, :not_found}
        end
    end
  end

  defp process_id(chat_id, chat_type) do
    "kanban:#{chat_type}:#{chat_id}"
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

  defp task_ids_from_board(board) do
    board_columns(board)
    |> Enum.flat_map(&task_ids_from_column/1)
  end

  defp column_id_from_column(column) do
    Map.get(column, :column_id) || Map.get(column, "column_id")
  end

  defp renamed_columns(board, column_id, title) do
    Enum.map(board_columns(board), fn column ->
      case column_id_from_column(column) == column_id do
        true -> Map.put(column, :title, title)
        false -> column
      end
    end)
  end

  defp columns_without_task(board, task) do
    Enum.map(board_columns(board), fn column ->
      updated_ids =
        task_ids_from_column(column)
        |> Enum.reject(fn current_task_id -> current_task_id == task.task_id end)

      Map.put(column, :task_ids, updated_ids)
    end)
  end

  defp materialize_board(board) when is_map(board) do
    task_ids = task_ids_from_board(board)

    tasks_map =
      case task_ids do
        [] ->
          %{}

        _ ->
          {:ok, tasks} = KanbanRepository.get_tasks_by_ids(task_ids)
          map_tasks_by_id(tasks)
      end

    columns =
      board_columns(board)
      |> Enum.map(fn column ->
        materialize_column(column, tasks_map)
      end)

    Map.put(board, :columns, columns)
  end

  defp sanitize_for_client(value) when is_map(value) do
    value
    |> Map.delete(:_id)
    |> Map.delete("_id")
    |> Enum.reduce(%{}, fn {key, current_value}, acc ->
      Map.put(acc, key, sanitize_for_client(current_value))
    end)
  end

  defp sanitize_for_client(value) when is_list(value) do
    Enum.map(value, &sanitize_for_client/1)
  end

  defp sanitize_for_client(value), do: value

  defp map_tasks_by_id(tasks) do
    Map.new(tasks, fn task ->
      task_id = Map.get(task, :task_id) || Map.get(task, "task_id")
      {task_id, sanitize_for_client(task)}
    end)
  end

  defp resolve_kanban_id(chat_id, "group") do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        plugin_instance_id(ChatPluginService.get_plugins_from_chat(group_chat))

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_kanban_id(chat_id, "private") do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        plugin_instance_id(ChatPluginService.get_plugins_from_chat(private_chat))

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_kanban_id(_chat_id, _chat_type), do: nil

  defp plugin_instance_id(plugins) when is_list(plugins) do
    kanban_plugin =
      Enum.find(plugins, fn plugin ->
        plugin_type = Map.get(plugin, :type) || Map.get(plugin, "type")
        plugin_type == "kanban"
      end)

    case kanban_plugin do
      nil ->
        nil

      plugin ->
        Map.get(plugin, :id) || Map.get(plugin, "id")
    end
  end

  defp plugin_instance_id(_), do: nil

  defp valid_identifier?(value) do
    is_binary(value) and value != ""
  end

  defp valid_position?(value) do
    is_integer(value)
  end
end
