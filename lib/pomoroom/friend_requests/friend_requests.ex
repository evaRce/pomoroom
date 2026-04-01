defmodule Pomoroom.FriendRequests do
  alias Pomoroom.FriendRequests.{FriendRequestSchema, FriendRequestService}

  defdelegate changeset(args), to: FriendRequestSchema
  defdelegate request_changeset(args), to: FriendRequestSchema
  defdelegate request_changeset(to_user, from_user), to: FriendRequestSchema

  defdelegate send_friend_request(to_user, from_user), to: FriendRequestService

  defdelegate restore_contact_if_request_exists(to_user, from_user, who_restore),
    to: FriendRequestService

  defdelegate accept_friend_request(to_user, from_user), to: FriendRequestService
  defdelegate get(to_user, from_user), to: FriendRequestService
  defdelegate is_owner_request?(to_user, from_user), to: FriendRequestService
  defdelegate reject_friend_request(to_user, from_user), to: FriendRequestService
  defdelegate delete_request(to_user, from_user), to: FriendRequestService
  defdelegate delete_request_between_users(user1, user2), to: FriendRequestService
  defdelegate delete_all_request(), to: FriendRequestService
  defdelegate request_is_pending?(to_user, from_user), to: FriendRequestService
  defdelegate get_status(to_user, from_user), to: FriendRequestService
  defdelegate exists?(to_user, from_user), to: FriendRequestService
  defdelegate determine_friend_request_users(user1, user2), to: FriendRequestService
end
