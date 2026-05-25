defmodule Pomoroom.ChatPlugins.Kanban.ColumnSchema do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :column_id, :string
    field :title, :string
    field :task_ids, {:array, :string}, default: []
  end

  def changeset(column, attrs) do
    column
    |> cast(attrs, [:column_id, :title, :task_ids])
    |> validate_required([:column_id, :title, :task_ids])
  end

  def column_changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def generate_column_id() do
    Ecto.UUID.generate()
  end
end
