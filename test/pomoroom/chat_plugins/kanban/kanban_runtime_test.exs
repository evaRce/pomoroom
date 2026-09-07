defmodule Pomoroom.ChatPlugins.Kanban.KanbanRuntimeTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.ChatPlugins.ChatPluginService
  alias Pomoroom.ChatPlugins.Kanban.KanbanService
  alias Pomoroom.{PrivateChats, Users}

  defp register(nickname) do
    {:ok, user} =
      Users.register_user(%{
        email: "#{nickname}@h.es",
        nickname: nickname,
        password: "password_1",
        password_confirmation: "password_1"
      })

    user
  end

  defp chat_with_kanban do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {:ok, _plugin} = ChatPluginService.install_plugin(chat.chat_id, "private", "kanban")

    chat.chat_id
  end

  defp find_column(board, title) do
    Enum.find(board.columns, fn column -> column.title == title end)
  end

  test "reports a missing plugin when applying an operation on a chat without kanban" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    assert KanbanService.apply_operation(chat.chat_id, "private", :add_column, "Nueva") ==
             {:error, :plugin_not_installed}
  end

  test "adds a column to the chat's board through the running process" do
    chat_id = chat_with_kanban()

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "Backlog")

    assert Enum.any?(board.columns, fn column -> column.title == "Backlog" end)
  end

  test "renames a column through the running process" do
    chat_id = chat_with_kanban()

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "Vieja")
    column_id = find_column(board, "Vieja").column_id

    {:ok, renamed_board} =
      KanbanService.apply_operation(chat_id, "private", :rename_column, {column_id, "Nueva"})

    assert Enum.any?(renamed_board.columns, fn column -> column.title == "Nueva" end)
  end

  test "adds, moves and deletes a task through the running process" do
    chat_id = chat_with_kanban()

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "A")
    column_a = find_column(board, "A").column_id
    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "B")
    column_b = find_column(board, "B").column_id

    {:ok, board} =
      KanbanService.apply_operation(chat_id, "private", :add_task, {column_a, "Tarea"})

    task_id = find_column(board, "A").tasks |> hd() |> Map.get(:task_id)

    {:ok, board} =
      KanbanService.apply_operation(
        chat_id,
        "private",
        :move_task,
        {task_id, column_a, column_b, 0}
      )

    assert find_column(board, "A").tasks == []
    assert length(find_column(board, "B").tasks) == 1

    {:ok, board} =
      KanbanService.apply_operation(chat_id, "private", :rename_task, {task_id, "Renombrada"})

    assert find_column(board, "B").tasks |> hd() |> Map.get(:title) == "Renombrada"

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :delete_task, task_id)

    assert find_column(board, "B").tasks == []
  end

  test "reorders a task through the running process" do
    chat_id = chat_with_kanban()

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "Columna")
    column_id = find_column(board, "Columna").column_id

    {:ok, _board} =
      KanbanService.apply_operation(chat_id, "private", :add_task, {column_id, "Primera"})

    {:ok, board_with_tasks} =
      KanbanService.apply_operation(chat_id, "private", :add_task, {column_id, "Segunda"})

    [first_task, second_task] = find_column(board_with_tasks, "Columna").tasks

    {:ok, reordered_board} =
      KanbanService.apply_operation(
        chat_id,
        "private",
        :reorder_task,
        {second_task.task_id, column_id, 0}
      )

    reordered_tasks = find_column(reordered_board, "Columna").tasks
    assert hd(reordered_tasks).task_id == second_task.task_id
    assert List.last(reordered_tasks).task_id == first_task.task_id
  end

  test "removes a column through the running process" do
    chat_id = chat_with_kanban()

    {:ok, board} = KanbanService.apply_operation(chat_id, "private", :add_column, "Temporal")
    column_id = find_column(board, "Temporal").column_id

    {:ok, updated_board} =
      KanbanService.apply_operation(chat_id, "private", :remove_column, column_id)

    refute Enum.any?(updated_board.columns, fn column -> column.column_id == column_id end)
  end
end
