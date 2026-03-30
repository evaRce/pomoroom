defmodule Pomoroom.GroupChats.GroupChatSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "group_chats" do
    field :chat_id, :string
    field :name, :string
    field :image, :string
    field :admin, {:array, :string}
    field :members, {:array, :map}
    field :invite_link, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.GroupChats.GroupChatSchema{}
    |> cast(args, [
      :chat_id,
      :name,
      :image,
      :admin,
      :members,
      :invite_link,
      :inserted_at,
      :updated_at
    ])
  end

  def group_chat_changeset(args) do
    changeset(args)
    |> validate_required([
      :chat_id,
      :name,
      :image,
      :admin,
      :members,
      :invite_link,
      :inserted_at,
      :updated_at
    ])
  end

  def group_chat_changeset(chat_id, name, image, from_user, invite_link) do
    now = DateTime.utc_now()

    group_chat = %{
      chat_id: chat_id,
      name: name,
      image: image,
      admin: [from_user],
      members: [%{"user_id" => from_user, "joined_at" => now}],
      invite_link: invite_link
    }

    changeset(group_chat)
    |> validate_required([:chat_id, :name, :image, :admin, :members, :invite_link])
  end
end
