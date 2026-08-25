defmodule Pomoroom.FriendRequests.FriendRequestSchemaTest do
  use Pomoroom.DataCase, async: true
  alias Pomoroom.FriendRequests.FriendRequestSchema

  test "is valid with correct attrs" do
    changeset = FriendRequestSchema.request_changeset("to_user", "from_user")

    assert changeset.valid?
  end

  test "defaults status to pending" do
    changeset = FriendRequestSchema.request_changeset("to_user", "from_user")

    assert Ecto.Changeset.get_field(changeset, :status) == "pending"
  end

  test "is invalid when to_user is missing" do
    changeset = FriendRequestSchema.request_changeset(nil, "from_user")

    refute changeset.valid?
    assert %{to_user: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid when from_user is missing" do
    changeset = FriendRequestSchema.request_changeset("to_user", nil)

    refute changeset.valid?
    assert %{from_user: ["can't be blank"]} = errors_on(changeset)
  end
end
