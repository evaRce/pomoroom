defmodule Pomoroom.ChatPlugins.Kanban.KanbanTaskSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "kanban_tasks" do
    field :task_id, :string
    field :kanban_id, :string
    field :column_id, :string
    field :title, :string
    field :order_in_column, :integer
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.Kanban.KanbanTaskSchema{}
    |> cast(args, [
      :task_id,
      :kanban_id,
      :column_id,
      :title,
      :order_in_column
    ])
  end

  def kanban_task_changeset(args) do
    changeset(args)
    |> validate_required([
      :task_id,
      :kanban_id,
      :column_id,
      :title,
      :order_in_column
    ])
  end

  def kanban_task_changeset(task_id, kanban_id, column_id, title, order_in_column) do
    task = %{
      task_id: task_id,
      kanban_id: kanban_id,
      column_id: column_id,
      title: title,
      order_in_column: order_in_column
    }

    changeset(task)
    |> validate_required([
      :task_id,
      :kanban_id,
      :column_id,
      :title,
      :order_in_column
    ])
  end

  def generate_task_id() do
    Ecto.UUID.generate()
  end
end
