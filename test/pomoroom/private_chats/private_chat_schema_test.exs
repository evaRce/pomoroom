defmodule Pomoroom.PrivateChats.PrivateChatSchemaTest do
  use Pomoroom.DataCase, async: true
  alias Pomoroom.PrivateChats.PrivateChatSchema

  test "is valid with correct attrs" do
    changeset = PrivateChatSchema.private_chat_changeset("chat-1", ["user_1", "user_2"])

    assert changeset.valid?
  end

  test "is invalid when chat_id is missing" do
    changeset = PrivateChatSchema.private_chat_changeset(nil, ["user_1", "user_2"])

    refute changeset.valid?
    assert %{chat_id: ["can't be blank"]} = errors_on(changeset)
  end

  test "sorts members independently of the input order" do
    changeset = PrivateChatSchema.private_chat_changeset("chat-1", ["user_2", "user_1"])

    assert Ecto.Changeset.get_field(changeset, :sorted_members) == ["user_1", "user_2"]
  end

  test "stores each member with a joined_at timestamp" do
    changeset = PrivateChatSchema.private_chat_changeset("chat-1", ["user_1", "user_2"])

    members = Ecto.Changeset.get_field(changeset, :members)

    assert Enum.map(members, & &1["user_id"]) == ["user_1", "user_2"]
    assert Enum.all?(members, &match?(%DateTime{}, &1["joined_at"]))
  end
end
