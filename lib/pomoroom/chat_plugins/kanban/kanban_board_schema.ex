defmodule Pomoroom.ChatPlugins.Kanban.KanbanBoardSchema do
  use Ecto.Schema
  import Ecto.Changeset

  alias Pomoroom.ChatPlugins.Kanban.ColumnSchema, as: Column

  schema "kanban_boards" do
    field :kanban_id, :string
    field :board_version, :integer, default: 0
    embeds_many :columns, Column, on_replace: :delete
  end

  def changeset(board, attrs) do
    board
    |> cast(attrs, [:kanban_id, :board_version])
    |> cast_embed(:columns, with: &Column.changeset/2)
    |> validate_required([:kanban_id, :board_version])
  end

  def kanban_board_changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def kanban_board_changeset(kanban_id, columns) do
    attrs = %{
      kanban_id: kanban_id,
      columns: columns
    }

    changeset(%__MODULE__{}, attrs)
  end

  def generate_kanban_id() do
    Ecto.UUID.generate()
  end
end
