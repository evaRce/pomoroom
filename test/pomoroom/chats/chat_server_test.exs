defmodule Pomoroom.Chats.Runtime.ChatServerTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.Chats.Runtime.{ChatServer, Runtime}
  alias Pomoroom.{PrivateChats, Users}

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

  defp chat_with_server do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    :ok = Runtime.ensure_chat_server_exists(chat.chat_id)

    {chat.chat_id, user1.nickname}
  end

  test "starting the server twice for the same chat is idempotent" do
    {chat_id, _user} = chat_with_server()

    assert Runtime.ensure_chat_server_exists(chat_id) == :ok
  end

  test "sends a message through the running server" do
    {chat_id, from_user} = chat_with_server()

    {:ok, message} = ChatServer.send_message(chat_id, from_user, "avatar.png", "hola")

    assert message.text == "hola"
    assert message.from_user == from_user
  end

  test "rejects sending an empty message" do
    {chat_id, from_user} = chat_with_server()

    assert {:error, _reason} = ChatServer.send_message(chat_id, from_user, nil, "")
  end

  test "reads back every message sent through the server" do
    {chat_id, from_user} = chat_with_server()

    {:ok, _message1} = ChatServer.send_message(chat_id, from_user, nil, "primero")
    Process.sleep(5)
    {:ok, _message2} = ChatServer.send_message(chat_id, from_user, nil, "segundo")

    messages = ChatServer.get_messages(chat_id)

    assert length(messages) == 2
    assert Enum.map(messages, & &1.text) == ["primero", "segundo"]
  end

  test "reads back a limited number of the most recent messages" do
    {chat_id, from_user} = chat_with_server()

    {:ok, _m1} = ChatServer.send_message(chat_id, from_user, nil, "uno")
    Process.sleep(5)
    {:ok, _m2} = ChatServer.send_message(chat_id, from_user, nil, "dos")
    Process.sleep(5)
    {:ok, _m3} = ChatServer.send_message(chat_id, from_user, nil, "tres")

    messages = ChatServer.get_messages(chat_id, 2)

    assert Enum.map(messages, & &1.text) == ["dos", "tres"]
  end

  test "joining the chat subscribes without error" do
    {chat_id, _user} = chat_with_server()

    assert ChatServer.join_chat(chat_id) == :ok
  end

  test "sends a plugin message attributed to a source instead of a user" do
    {chat_id, _user} = chat_with_server()

    {:ok, message} = ChatServer.send_plugin_message(chat_id, "pomodoro", "el tiempo terminó")

    assert message.text == "el tiempo terminó"
    assert message.from_user == "pomodoro"
  end

  test "reads back messages sent before a given point in time" do
    {chat_id, from_user} = chat_with_server()

    {:ok, _m1} = ChatServer.send_message(chat_id, from_user, nil, "viejo")
    Process.sleep(5)
    cutoff = NaiveDateTime.utc_now()
    Process.sleep(5)
    {:ok, _m2} = ChatServer.send_message(chat_id, from_user, nil, "nuevo")

    older_messages = ChatServer.get_messages_before(chat_id, cutoff, 10)

    assert Enum.map(older_messages, & &1.text) == ["viejo"]
  end
end
