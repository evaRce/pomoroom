defmodule Pomoroom.ChatPlugins.Kanban.KanbanServiceTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.ChatPlugins.Kanban.KanbanService

  defp create_board do
    kanban_id = Ecto.UUID.generate()
    {:ok, _board} = KanbanService.create_kanban_board(kanban_id)
    kanban_id
  end

  defp add_column(kanban_id, title) do
    {:ok, board} = KanbanService.add_column(kanban_id, title)
    board
  end

  defp column_id(board, title) do
    board.columns
    |> Enum.find(fn column -> column.title == title end)
    |> Map.get(:column_id)
  end

  test "creates a board with the three default columns" do
    kanban_id = Ecto.UUID.generate()

    {:ok, board} = KanbanService.create_kanban_board(kanban_id)

    assert board.kanban_id == kanban_id
    assert length(board.columns) == 3
  end

  test "reads back a created board with materialized empty task lists" do
    kanban_id = create_board()

    {:ok, board} = KanbanService.get_board(kanban_id)

    assert Enum.all?(board.columns, fn column -> column.tasks == [] end)
  end

  test "rejects reading a board with an invalid identifier" do
    assert KanbanService.get_board("") == {:error, :invalid_kanban_id}
  end

  test "reports a missing board" do
    assert KanbanService.get_board(Ecto.UUID.generate()) == {:error, :not_found}
  end

  test "adds a column to a board" do
    kanban_id = create_board()

    board = add_column(kanban_id, "Bloqueado")

    assert length(board.columns) == 4
    assert Enum.any?(board.columns, fn column -> column.title == "Bloqueado" end)
  end

  test "rejects adding a column beyond the maximum of 5" do
    kanban_id = create_board()

    add_column(kanban_id, "Columna 4")
    board = add_column(kanban_id, "Columna 5")
    assert length(board.columns) == 5

    assert KanbanService.add_column(kanban_id, "Columna 6") == {:error, :column_limit_reached}
  end

  test "rejects adding a column with an empty or too long title" do
    kanban_id = create_board()

    assert KanbanService.add_column(kanban_id, "") == {:error, :invalid_params}
    assert KanbanService.add_column(kanban_id, String.duplicate("a", 26)) == {:error, :invalid_params}
  end

  test "renames a column" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Vieja")
    column_id = column_id(board, "Vieja")

    {:ok, renamed_board} = KanbanService.rename_column(kanban_id, column_id, "Nueva")

    assert Enum.any?(renamed_board.columns, fn column -> column.title == "Nueva" end)
  end

  test "removes a column together with its tasks" do
    kanban_id = create_board()
    board = add_column(kanban_id, "A eliminar")
    column_id = column_id(board, "A eliminar")

    {:ok, _task_board} = KanbanService.add_task(kanban_id, column_id, "Tarea perdida")

    {:ok, updated_board} = KanbanService.remove_column(kanban_id, column_id)

    refute Enum.any?(updated_board.columns, fn column -> column.column_id == column_id end)
  end

  test "reports removing an unknown column" do
    kanban_id = create_board()

    assert KanbanService.remove_column(kanban_id, "missing_column") == {:error, :not_found}
  end

  test "adds a task to a column" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna con tareas")
    column_id = column_id(board, "Columna con tareas")

    {:ok, updated_board} = KanbanService.add_task(kanban_id, column_id, "Escribir tests")

    column = Enum.find(updated_board.columns, fn column -> column.column_id == column_id end)
    assert length(column.tasks) == 1
    assert hd(column.tasks).title == "Escribir tests"
  end

  test "rejects adding a task beyond the maximum of 20 per column" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna llena")
    column_id = column_id(board, "Columna llena")

    Enum.each(1..20, fn n ->
      {:ok, _board} = KanbanService.add_task(kanban_id, column_id, "Tarea #{n}")
    end)

    assert KanbanService.add_task(kanban_id, column_id, "Tarea 21") ==
             {:error, :task_limit_reached}
  end

  test "rejects adding a task to an unknown column" do
    kanban_id = create_board()

    assert KanbanService.add_task(kanban_id, "missing_column", "Tarea") == {:error, :not_found}
  end

  test "moves a task between columns" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Origen")
    from_column_id = column_id(board, "Origen")
    board = add_column(kanban_id, "Destino")
    to_column_id = column_id(board, "Destino")

    {:ok, board_with_task} = KanbanService.add_task(kanban_id, from_column_id, "Tarea movible")
    from_column = Enum.find(board_with_task.columns, &(&1.column_id == from_column_id))
    task_id = hd(from_column.tasks).task_id

    {:ok, moved_board} = KanbanService.move_task(task_id, from_column_id, to_column_id, 0)

    from_column = Enum.find(moved_board.columns, &(&1.column_id == from_column_id))
    to_column = Enum.find(moved_board.columns, &(&1.column_id == to_column_id))

    assert from_column.tasks == []
    assert length(to_column.tasks) == 1
  end

  test "reorders a task within the same column" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna")
    column_id = column_id(board, "Columna")

    {:ok, _board} = KanbanService.add_task(kanban_id, column_id, "Primera")
    {:ok, board_with_tasks} = KanbanService.add_task(kanban_id, column_id, "Segunda")

    column = Enum.find(board_with_tasks.columns, &(&1.column_id == column_id))
    [first_task, second_task] = column.tasks

    {:ok, reordered_board} = KanbanService.reorder_task(second_task.task_id, column_id, 0)

    reordered_column = Enum.find(reordered_board.columns, &(&1.column_id == column_id))
    assert hd(reordered_column.tasks).task_id == second_task.task_id
    assert List.last(reordered_column.tasks).task_id == first_task.task_id
  end

  test "renames a task" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna")
    column_id = column_id(board, "Columna")

    {:ok, board} = KanbanService.add_task(kanban_id, column_id, "Titulo viejo")
    column = Enum.find(board.columns, &(&1.column_id == column_id))
    task_id = hd(column.tasks).task_id

    {:ok, renamed_board} = KanbanService.rename_task(task_id, "Titulo nuevo")

    renamed_column = Enum.find(renamed_board.columns, &(&1.column_id == column_id))
    assert hd(renamed_column.tasks).title == "Titulo nuevo"
  end

  test "deletes a task" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna")
    column_id = column_id(board, "Columna")

    {:ok, board} = KanbanService.add_task(kanban_id, column_id, "Tarea a borrar")
    column = Enum.find(board.columns, &(&1.column_id == column_id))
    task_id = hd(column.tasks).task_id

    {:ok, updated_board} = KanbanService.delete_task(task_id)

    updated_column = Enum.find(updated_board.columns, &(&1.column_id == column_id))
    assert updated_column.tasks == []
    assert KanbanService.get_task(task_id) == {:error, :not_found}
  end

  test "deletes a board instance along with its tasks" do
    kanban_id = create_board()
    board = add_column(kanban_id, "Columna")
    column_id = column_id(board, "Columna")
    {:ok, _board} = KanbanService.add_task(kanban_id, column_id, "Tarea")

    {:ok, _deleted} = KanbanService.delete_kanban_instance(kanban_id, "chat-1", "private")

    assert KanbanService.get_board(kanban_id) == {:error, :not_found}
  end

  test "reports a missing plugin when getting a board for a chat without kanban installed" do
    assert KanbanService.get_board_for_chat("missing-chat", "private") ==
             {:error, :plugin_not_installed}
  end
end
