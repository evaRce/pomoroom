defmodule Pomoroom.ChatPlugins.Kanban.KanbanTaskSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "kanban_tasks" do
    field :task_id, :string
    field :kanban_id, :string
    field :title, :string
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.Kanban.KanbanTaskSchema{}
    |> cast(args, [
      :task_id,
      :kanban_id,
      :title
    ])
  end

  def kanban_task_changeset(args) do
    changeset(args)
    |> validate_required([
      :task_id,
      :kanban_id,
      :title
    ])
  end

  def kanban_task_changeset(task_id, kanban_id, title) do
    task = %{
      task_id: task_id,
      kanban_id: kanban_id,
      title: title
    }

    changeset(task)
    |> validate_required([
      :task_id,
      :kanban_id,
      :title
    ])
  end

  def generate_task_id() do
    Ecto.UUID.generate()
  end
end
