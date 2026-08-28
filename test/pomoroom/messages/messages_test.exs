defmodule Pomoroom.MessagesTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.{Messages, PrivateChats, Users}

  defp register(nickname) do
    {:ok, user} =
      Users.register_user(%{
        email: "#{nickname}@h.es",
        nickname: nickname,
        password: "password_1",
        password_confirmation: "password_1"
      })

    user
  end

  defp private_chat_id() do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {chat.chat_id, user1.nickname}
  end

  test "creates a message with a unique id" do
    {chat_id, from_user} = private_chat_id()

    {:ok, message1} = Messages.new_message("message1", from_user, chat_id)
    {:ok, message2} = Messages.new_message("message2", from_user, chat_id)

    assert message1.text == "message1"
    assert message1.from_user == from_user
    assert message1.chat_id == chat_id
    refute message1.msg_id == message2.msg_id
  end

  test "rejects a message without required fields" do
    {chat_id, from_user} = private_chat_id()

    {:error, errors} = Messages.new_message("", from_user, chat_id)

    assert %{text: _} = errors
  end

  test "deletes a single message" do
    {chat_id, from_user} = private_chat_id()

    {:ok, message} = Messages.new_message("message1", from_user, chat_id)

    assert Messages.delete_message(message.msg_id) == :ok
    assert Messages.get_by_id(message.msg_id) == {:error, :not_found}
  end

  test "returns not_found for a missing or blank message id" do
    assert Messages.get_by_id("") == {:error, :not_found}
    assert Messages.get_by_id("missing_msg_id") == {:error, :not_found}
  end

  test "deletes every message belonging to a chat" do
    {chat_id, from_user} = private_chat_id()

    {:ok, _message1} = Messages.new_message("message1", from_user, chat_id)
    {:ok, _message2} = Messages.new_message("message2", from_user, chat_id)

    assert Messages.delete_all_belongs_to_chat(chat_id) == :ok
    assert Messages.get_chat_messages(chat_id) == {:ok, []}
  end

  test "retrieves every message of a chat in chronological order" do
    {chat_id, from_user} = private_chat_id()

    {:ok, message1} = Messages.new_message("message1", from_user, chat_id)
    Process.sleep(5)
    {:ok, message2} = Messages.new_message("message2", from_user, chat_id)

    {:ok, [msg1, msg2]} = Messages.get_chat_messages(chat_id)

    assert msg1.msg_id == message1.msg_id
    assert msg2.msg_id == message2.msg_id
  end
end
