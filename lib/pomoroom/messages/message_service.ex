defmodule Pomoroom.Messages.MessageService do
  alias Pomoroom.Messages.{MessageSchema, MessageRepository}
  import Ecto.Changeset

  def new_message(message, from_user, chat_id) do
    msg_changeset =
      MessageSchema.get_msg_id()
      |> MessageSchema.message_changeset(message, from_user, chat_id)
      |> set_timestamps()

    if msg_changeset.valid? do
      case MessageRepository.create(msg_changeset.changes) do
        {:ok, _result} ->
          {:ok, msg_changeset.changes}

        {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => errmsg}]}} ->
          {:error, parse_duplicate_key_error(errmsg)}
      end
    else
      {:error, msg_changeset.errors}
    end
  end

  def delete_message(msg_id), do: MessageRepository.delete(msg_id)

  def delete_all_belongs_to_chat(chat_id),
    do: MessageRepository.delete_all_belongs_to_chat(chat_id)

  def delete_all_messages(), do: MessageRepository.delete_all()

  def get_by_id(msg_id), do: MessageRepository.get_by_id(msg_id)

  def get_chat_messages(chat_id, limit \\ :all, joined_at \\ nil),
    do: MessageRepository.get_chat_messages(chat_id, limit, joined_at)

  def get_chat_messages_before(chat_id, before_inserted_at, limit),
    do: MessageRepository.get_chat_messages_before(chat_id, before_inserted_at, limit)

  def get_chat_messages_before(chat_id, before_inserted_at, limit, before_db_id),
    do:
      MessageRepository.get_chat_messages_before(chat_id, before_inserted_at, limit, before_db_id)

  def get_chat_messages_before(chat_id, before_inserted_at, limit, before_db_id, joined_at),
    do:
      MessageRepository.get_chat_messages_before(
        chat_id,
        before_inserted_at,
        limit,
        before_db_id,
        joined_at
      )

  defp parse_duplicate_key_error(errmsg) do
    cond do
      String.contains?(errmsg, "msg_id") ->
        %{msg_id: "Este public id ya está siendo usado"}
    end
  end

  defp set_timestamps(changeset) do
    now = NaiveDateTime.utc_now()
    change(changeset, %{inserted_at: now, updated_at: now})
  end
end
