defmodule Pomoroom.Messages.MessageSchemaTest do
  use Pomoroom.DataCase, async: true
  alias Pomoroom.Messages.MessageSchema

  test "is valid with correct attrs" do
    changeset = MessageSchema.message_changeset("msg-1", "hello", "user_1", "chat-1")

    assert changeset.valid?
  end

  test "is invalid when msg_id is missing" do
    changeset = MessageSchema.message_changeset(nil, "hello", "user_1", "chat-1")

    refute changeset.valid?
    assert %{msg_id: ["can't be blank"]} = errors_on(changeset)
  end
  
  test "is invalid when text is missing" do
    changeset = MessageSchema.message_changeset("msg-1", nil, "user_1", "chat-1")

    refute changeset.valid?
    assert %{text: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid when from_user is missing" do
    changeset = MessageSchema.message_changeset("msg-1", "hello", nil, "chat-1")

    refute changeset.valid?
    assert %{from_user: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid when chat_id is missing" do
    changeset = MessageSchema.message_changeset("msg-1", "hello", "user_1", nil)

    refute changeset.valid?
    assert %{chat_id: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid when text is longer than 5000 characters" do
    long_text = String.duplicate("a", 5_001)
    changeset = MessageSchema.message_changeset("msg-1", long_text, "user_1", "chat-1")

    refute changeset.valid?
    assert "should be at most 5000 character(s)" in errors_on(changeset).text
  end

  test "is valid with text of exactly 5000 characters" do
    max_text = String.duplicate("a", 5_000)
    changeset = MessageSchema.message_changeset("msg-1", max_text, "user_1", "chat-1")

    assert changeset.valid?
  end

  test "get_msg_id generates a unique uuid" do
    assert MessageSchema.get_msg_id() != MessageSchema.get_msg_id()
  end
end
