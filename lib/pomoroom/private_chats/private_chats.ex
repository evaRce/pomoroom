defmodule Pomoroom.PrivateChats do
  alias Pomoroom.PrivateChats.{PrivateChatSchema, PrivateChatService}

  defdelegate changeset(args), to: PrivateChatSchema
  defdelegate private_chat_changeset(args), to: PrivateChatSchema
  defdelegate private_chat_changeset(chat_id, members), to: PrivateChatSchema

  defdelegate create_private_chat(to_user, from_user), to: PrivateChatService
  defdelegate delete_contact(chat_id, from_user), to: PrivateChatService
  defdelegate delete_all_private_chats(), to: PrivateChatService
  defdelegate get(chat_id), to: PrivateChatService
  defdelegate get(to_user, from_user), to: PrivateChatService
  defdelegate ensure_exists(to_user, from_user), to: PrivateChatService
  defdelegate update_restore_deleted_contact(chat, from_user), to: PrivateChatService
  defdelegate get_member_joined_at(chat, member), to: PrivateChatService
  defdelegate both_users_deleted?(deleted_by, members), to: PrivateChatService
end
