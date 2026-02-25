defmodule Pomoroom.PrivateChats.PrivateChatSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "private_chats" do
    field :chat_id, :string
    field :members, {:array, :string}
    field :sorted_members, {:array, :string}
    field :deleted_by, {:array, :string}
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.PrivateChats.PrivateChatSchema{}
    |> cast(args, [
      :chat_id,
      :members,
      :sorted_members,
      :deleted_by,
      :inserted_at,
      :updated_at
    ])
  end

  def private_chat_changeset(args) do
    changeset(args)
    |> validate_required([
      :chat_id,
      :members,
      :sorted_members,
      :deleted_by,
      :inserted_at,
      :updated_at
    ])
  end

  def private_chat_changeset(chat_id, members) do
    private_chat = %{
      chat_id: chat_id,
      members: members,
      sorted_members: Enum.sort(members),
      deleted_by: []
    }

    changeset(private_chat)
    |> validate_required([:chat_id, :members, :sorted_members, :deleted_by])
  end
end