defmodule Pomoroom.Users do
  alias Pomoroom.Users.{User, UserService}

  defdelegate changeset_without_passw(args), to: User
  defdelegate changeset(args), to: User

  defdelegate register_user(args), to: UserService
  defdelegate delete_all_users(), to: UserService
  defdelegate get_with_passw(field, value), to: UserService
  defdelegate get_by(field, value), to: UserService
  defdelegate get_contacts(user), to: UserService
  defdelegate get_all_contacts(user), to: UserService
  defdelegate get_all_my_chats_id(user), to: UserService
  defdelegate exists_nickname?(nickname), to: UserService
end
