defmodule Pomoroom.ChatPlugins.Kanbans do
  alias Pomoroom.ChatPlugins.Kanban.KanbanService

  defdelegate create_board(), to: KanbanService, as: :create_kanban_board
  defdelegate get_board(kanban_id), to: KanbanService
  defdelegate add_column(kanban_id, title), to: KanbanService
  defdelegate remove_column(kanban_id, column_id), to: KanbanService
  defdelegate add_task(kanban_id, column_id, title), to: KanbanService
  defdelegate move_task(task_id, from_column_id, to_column_id, new_position), to: KanbanService
  defdelegate reorder_task(task_id, column_id, new_position), to: KanbanService
  defdelegate delete_board(kanban_id), to: KanbanService
  defdelegate get_task(task_id), to: KanbanService
end
