defmodule Pomoroom.GroupChats.GroupChatSchemaTest do
  use Pomoroom.DataCase, async: true
  alias Pomoroom.GroupChats.GroupChatSchema

  @valid_attrs %{
    chat_id: "chat-1",
    name: "group name",
    image: "/images/default_group.svg",
    from_user: "user_1",
    invite_link: "invite-link-1"
  }

  defp build_changeset(attrs) do
    GroupChatSchema.group_chat_changeset(
      attrs.chat_id,
      attrs.name,
      attrs.image,
      attrs.from_user,
      attrs.invite_link
    )
  end

  test "is valid with correct attrs" do
    changeset = build_changeset(@valid_attrs)

    assert changeset.valid?
  end

  test "sets the creator as the only admin and member" do
    changeset = build_changeset(@valid_attrs)

    assert Ecto.Changeset.get_field(changeset, :admin) == ["user_1"]
    assert [%{"user_id" => "user_1"}] = Ecto.Changeset.get_field(changeset, :members)
  end

  test "is invalid when chat_id is missing" do
    changeset = build_changeset(%{@valid_attrs | chat_id: nil})

    refute changeset.valid?
    assert %{chat_id: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid when name is empty" do
    changeset = build_changeset(%{@valid_attrs | name: ""})

    refute changeset.valid?
    assert %{name: [_message]} = errors_on(changeset)
  end

  test "is invalid when name is longer than 50 characters" do
    changeset = build_changeset(%{@valid_attrs | name: String.duplicate("a", 51)})

    refute changeset.valid?
    assert "should be at most 50 character(s)" in errors_on(changeset).name
  end

  test "is invalid when image is missing" do
    changeset = build_changeset(%{@valid_attrs | image: nil})

    refute changeset.valid?
    assert %{image: ["can't be blank"]} = errors_on(changeset)
  end

  test "is valid at the exact name length boundaries" do
    changeset_min = build_changeset(%{@valid_attrs | name: "a"})
    changeset_max = build_changeset(%{@valid_attrs | name: String.duplicate("a", 50)})

    assert changeset_min.valid?
    assert changeset_max.valid?
  end

  test "is invalid when invite_link is missing" do
    changeset = build_changeset(%{@valid_attrs | invite_link: nil})

    refute changeset.valid?
    assert %{invite_link: ["can't be blank"]} = errors_on(changeset)
  end
end
