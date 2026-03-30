defmodule Pomoroom.Messages.MessageSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "messages" do
    field :msg_id, :string
    field :text, :string
    field :from_user, :string
    field :chat_id, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.Messages.MessageSchema{}
    |> cast(args, [
      :msg_id,
      :text,
      :from_user,
      :chat_id,
      :inserted_at,
      :updated_at
    ])
  end

  def message_changeset(args) do
    changeset(args)
    |> validate_required([
      :msg_id,
      :text,
      :from_user,
      :chat_id,
      :inserted_at,
      :updated_at
    ])
  end

  def message_changeset(msg_id, message, from_user, chat_id) do
    msg = %{msg_id: msg_id, text: message, from_user: from_user, chat_id: chat_id}

    changeset(msg)
    |> validate_required([:msg_id, :text, :from_user, :chat_id])
  end

  def get_msg_id() do
    Ecto.UUID.generate()
  end
end
