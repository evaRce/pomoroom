defmodule Pomoroom.PrivateChatsTest do
  use Pomoroom.IntegrationCase, async: false

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

  test "creates a private chat and normalizes its fields" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    assert Enum.map(chat.members, & &1["user_id"]) == ["to_user2", "from_user1"]
    assert chat.sorted_members == ["from_user1", "to_user2"]
    assert chat.deleted_by == []
  end

  test "prevents creating a duplicate private chat between the same two users" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {:error, error} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    assert error == %{error: "El contacto ya está añadido"}
  end

  test "deleting the chat is a no-op until both members have deleted it" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    {:ok, message1} = PrivateChats.delete_contact(chat.chat_id, user1.nickname)
    assert message1 == "Contacto eliminado"
    assert {:ok, _still_there} = PrivateChats.get(chat.chat_id)

    {:ok, message2} = PrivateChats.delete_contact(chat.chat_id, user2.nickname)
    assert message2 == "Contacto eliminado"
    assert PrivateChats.get(chat.chat_id) == {:error, "Chat no encontrado"}
  end

  test "returns an error when deleting a contact from a chat that does not exist" do
    user1 = register("from_user1")

    assert PrivateChats.delete_contact("missing_chat_id", user1.nickname) ==
             {:error, "Chat no encontrado"}
  end

  test "gets a private chat by chat id or by its members, erroring out otherwise" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    assert PrivateChats.get("missing_chat_id") == {:error, "Chat no encontrado"}
    assert PrivateChats.get(user2.nickname, user1.nickname) == {:error, "Chat no encontrado"}

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    {:ok, by_id} = PrivateChats.get(chat.chat_id)
    {:ok, by_members} = PrivateChats.get(user2.nickname, user1.nickname)

    assert by_id.chat_id == chat.chat_id
    assert by_members.chat_id == chat.chat_id
  end

  test "ensure_exists reuses an existing chat instead of creating a new one" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, created} = PrivateChats.ensure_exists(user2.nickname, user1.nickname)
    {:ok, reused} = PrivateChats.ensure_exists(user2.nickname, user1.nickname)

    assert created.chat_id == reused.chat_id
  end

  test "counts only chats the user has not deleted" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    assert PrivateChats.count_active_chats(user1.nickname) == 0

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    assert PrivateChats.count_active_chats(user1.nickname) == 1

    {:ok, _message} = PrivateChats.delete_contact(chat.chat_id, user1.nickname)
    assert PrivateChats.count_active_chats(user1.nickname) == 0
    assert PrivateChats.count_active_chats(user2.nickname) == 1
  end
end
