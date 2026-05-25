defmodule Pomoroom.ChatPlugins.Kanbans do
  alias Pomoroom.ChatPlugins.Kanbans.KanbanService

  defdelegate create_kanban_board(kanban_id), to: KanbanService
  defdelegate default_columns(), to: KanbanService
  defdelegate get_board(kanban_id), to: KanbanService
  defdelegate get_board_for_chat(chat_id, chat_type), to: KanbanService
  defdelegate add_column(kanban_id, title), to: KanbanService
  defdelegate remove_column(kanban_id, column_id), to: KanbanService
  defdelegate add_task(kanban_id, column_id, title), to: KanbanService
  defdelegate move_task(task_id, from_column_id, to_column_id, new_position), to: KanbanService
  defdelegate reorder_task(task_id, column_id, new_position), to: KanbanService
  defdelegate delete_kanban_instance(kanban_id, chat_id, chat_type), to: KanbanService
  defdelegate delete_kanban_for_chat(chat_id, chat_type), to: KanbanService
  defdelegate delete_task(task_id), to: KanbanService
  defdelegate rename_column(kanban_id, column_id, title), to: KanbanService
  defdelegate rename_task(task_id, title), to: KanbanService
  defdelegate ensure_started(chat_id, chat_type), to: KanbanService
  defdelegate start_kanban_process(chat_id, chat_type, kanban_id), to: KanbanService
  defdelegate terminate_kanban_process(chat_id, chat_type), to: KanbanService
end
