defmodule Pomoroom.IntegrationCase do
  @moduledoc """
  Test case for integration tests that exercise a context against the real
  MongoDB instance configured for the `:test` environment (`pomoroom_test`).

  There is no SQL-style sandbox for Mongo, so every test starts from a clean
  slate by wiping the collections touched by these contexts.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      import Pomoroom.IntegrationCase
    end
  end

  setup do
    Pomoroom.Messages.delete_all_messages()
    Pomoroom.FriendRequests.delete_all_request()
    Pomoroom.PrivateChats.delete_all_private_chats()
    Pomoroom.GroupChats.delete_all_group_chats()
    Pomoroom.Users.delete_all_users()
    :ok
  end
end
