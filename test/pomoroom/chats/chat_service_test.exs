defmodule Pomoroom.Chats.ChatServiceTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.Chats.ChatService
  alias Pomoroom.{GroupChats, PrivateChats, Users}

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

  test "generates a unique chat id" do
    assert ChatService.generate_chat_id() != ChatService.generate_chat_id()
  end

  test "reports whether a private or group chat exists" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    refute ChatService.exists?("missing_chat_id")

    {:ok, private_chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    assert ChatService.exists?(private_chat.chat_id)

    {:ok, group_chat} = GroupChats.create_group_chat(user1.nickname, "Grupo")
    assert ChatService.exists?(group_chat.chat_id)
  end

  test "deletes a chat from the given collection" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)

    assert {:ok, _result} = ChatService.delete_chat("private_chats", chat.chat_id)
    refute ChatService.exists?(chat.chat_id)
  end

  test "lists every group chat a user belongs to with its data materialized" do
    user1 = register("from_user1")

    {:ok, []} = ChatService.get_all_group_chats_data(user1.nickname)

    {:ok, group_chat} = GroupChats.create_group_chat(user1.nickname, "Grupo")
    {:ok, groups} = ChatService.get_all_group_chats_data(user1.nickname)

    assert Enum.map(groups, & &1.chat_id) == [group_chat.chat_id]
  end

  test "lists every chat id (private and group) a user belongs to" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    assert ChatService.get_all_chats_id(user1.nickname) == []

    {:ok, private_chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {:ok, group_chat} = GroupChats.create_group_chat(user1.nickname, "Grupo")

    chat_ids = ChatService.get_all_chats_id(user1.nickname)

    assert Enum.sort(chat_ids) == Enum.sort([private_chat.chat_id, group_chat.chat_id])
  end
end
