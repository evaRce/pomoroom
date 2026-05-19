defmodule Pomoroom.ChatPlugins.Kanban.KanbanBoardSchema do
  use Ecto.Schema
  import Ecto.Changeset

  alias Pomoroom.ChatPlugins.Kanban.ColumnSchema, as: Column

  schema "kanban_boards" do
    field :kanban_id, :string
    embeds_many :columns, Column, on_replace: :delete
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.Kanban.KanbanBoardSchema{}
    |> cast(args, [:kanban_id])
    |> cast_embed(:columns, with: &Column.changeset/1)
  end

  def kanban_board_changeset(args) do
    changeset(args)
    |> validate_required([
      :kanban_id,
      :columns
    ])
  end

  def kanban_board_changeset(kanban_id, columns) do
    board = %{
      kanban_id: kanban_id,
      columns: columns
    }

    changeset(board)
    |> validate_required([
      :kanban_id,
      :columns
    ])
  end

  def generate_kanban_id() do
    Ecto.UUID.generate()
  end
end
