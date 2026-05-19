defmodule Pomoroom.ChatPlugins.Kanban.ColumnSchema do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :column_id, :string
    field :title, :string
    field :task_ids, {:array, :string}, default: []
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.Kanban.ColumnSchema{}
    |> cast(args, [
      :column_id,
      :title,
      :task_ids
    ])
  end

  def column_changeset(args) do
    changeset(args)
    |> validate_required([
      :column_id,
      :title,
      :task_ids
    ])
  end

  def column_changeset(column_id, title, task_ids) do
    column = %{
      column_id: column_id,
      title: title,
      task_ids: task_ids
    }

    changeset(column)
    |> validate_required([
      :column_id,
      :title,
      :task_ids
    ])
  end

  def generate_column_id() do
    Ecto.UUID.generate()
  end
end
