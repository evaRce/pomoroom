defmodule Pomoroom.Messages do
  alias Pomoroom.Messages.{MessageSchema, MessageService}

  defdelegate changeset(args), to: MessageSchema
  defdelegate message_changeset(args), to: MessageSchema
  defdelegate message_changeset(msg_id, message, from_user, chat_id), to: MessageSchema
  defdelegate get_msg_id(), to: MessageSchema

  defdelegate new_message(message, from_user, chat_id), to: MessageService
  defdelegate delete_message(msg_id), to: MessageService
  defdelegate delete_all_belongs_to_chat(chat_id), to: MessageService
  defdelegate delete_all_messages(), to: MessageService
  defdelegate get_by_id(msg_id), to: MessageService
  defdelegate get_chat_messages(chat_id), to: MessageService
  defdelegate get_chat_messages(chat_id, limit), to: MessageService
  defdelegate get_chat_messages(chat_id, limit, joined_at), to: MessageService
  defdelegate get_chat_messages_before(chat_id, before_inserted_at, limit), to: MessageService

  defdelegate get_chat_messages_before(chat_id, before_inserted_at, limit, before_db_id),
    to: MessageService

  defdelegate get_chat_messages_before(
                chat_id,
                before_inserted_at,
                limit,
                before_db_id,
                joined_at
              ),
              to: MessageService
end
