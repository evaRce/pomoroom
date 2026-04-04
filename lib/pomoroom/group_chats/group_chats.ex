defmodule Pomoroom.GroupChats do
  alias Pomoroom.GroupChats.{GroupChatSchema, GroupChatService}

  defdelegate changeset(args), to: GroupChatSchema
  defdelegate group_chat_changeset(args), to: GroupChatSchema

  defdelegate group_chat_changeset(chat_id, name, image, from_user, invite_link),
    to: GroupChatSchema

  defdelegate create_group_chat(from_user, name), to: GroupChatService
  defdelegate add_member(group_name, user, new_member), to: GroupChatService
  defdelegate join_group_with_link(invite_link, user), to: GroupChatService
  defdelegate delete(group_name, user), to: GroupChatService
  defdelegate delete_member(group_name, user, member), to: GroupChatService
  defdelegate delete_all_group_chats(), to: GroupChatService
  defdelegate get_by(field, value), to: GroupChatService
  defdelegate get_members(group_name), to: GroupChatService
  defdelegate is_admin?(group_name, user), to: GroupChatService
  defdelegate member_state(group_name, user), to: GroupChatService
  defdelegate can_send_message?(group_name, user), to: GroupChatService
  defdelegate add_admin(group_name, user, member), to: GroupChatService
  defdelegate delete_admin(group_name, user, member), to: GroupChatService
end
