defmodule Pomoroom.GroupChatsTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.{GroupChats, Users}

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

  test "creates a group chat and rejects a duplicate name" do
    user1 = register("from_user1")

    {:ok, group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:error, duplicate} = GroupChats.create_group_chat(user1.nickname, "grupo1")

    assert group_chat.name == "grupo1"
    assert group_chat.admin == ["from_user1"]
    assert String.match?(group_chat.image, ~r/^\/images\/default_group\/default_group-.*\.svg$/)
    assert Enum.map(group_chat.members, & &1["user_id"]) == ["from_user1"]
    assert duplicate == %{error: "El grupo `grupo1` ya está creado"}
  end

  test "only an admin can add members, and cannot add the same member twice" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    user3 = register("to_user3")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")

    {:ok, added} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)
    {:error, already_member} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)
    {:error, no_permission} = GroupChats.add_member("grupo1", user2.nickname, user3.nickname)

    assert added.message == "Usuario to_user2 añadido al grupo"
    assert already_member == "El usuario to_user2 ya es miembro del grupo"
    assert no_permission == "El usuario to_user2 no tiene permiso para añadir miembros al grupo"
  end

  test "a member leaving deletes the chat once nobody remains" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)

    {:ok, left} = GroupChats.delete("grupo1", user2.nickname)
    {:ok, last_left} = GroupChats.delete("grupo1", user1.nickname)

    assert left.message == "Has salido del grupo grupo1"
    assert left.removed_member == user2.nickname
    assert last_left.chat_deleted == true
    assert GroupChats.get_by("name", "grupo1") == {:error, "Chat no encontrado"}
  end

  test "an admin can delete the group for everyone, and non-admins are rejected" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)

    {:error, no_permission} = GroupChats.delete_for_everyone("grupo1", user2.nickname)
    assert no_permission == "El usuario to_user2 no tiene permiso para eliminar el grupo"

    {:ok, deleted} = GroupChats.delete_for_everyone("grupo1", user1.nickname)

    assert deleted.group_name == "grupo1"
    assert Enum.sort(deleted.member_ids) == Enum.sort([user1.nickname, user2.nickname])
    assert GroupChats.get_by("name", "grupo1") == {:error, "Chat no encontrado"}
  end

  test "an admin can remove a member, and non-admins are rejected" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    user3 = register("to_user3")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)

    {:ok, removed} = GroupChats.delete_member("grupo1", user1.nickname, user2.nickname)
    assert removed.message == "Usuario to_user2 eliminado del grupo"

    {:ok, _group_chat2} = GroupChats.create_group_chat(user3.nickname, "grupo2")
    {:ok, _} = GroupChats.add_member("grupo2", user3.nickname, user1.nickname)

    {:error, no_permission} = GroupChats.delete_member("grupo2", user1.nickname, user3.nickname)
    assert no_permission == "El usuario from_user1 no tiene permiso para eliminar miembros del grupo"
  end

  test "gets a group chat by field, returning an error when missing" do
    user1 = register("from_user1")
    {:ok, group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")

    {:ok, found} = GroupChats.get_by("chat_id", group_chat.chat_id)
    assert found.name == "grupo1"

    assert GroupChats.get_by("chat_id", "missing_chat_id") == {:error, "Chat no encontrado"}
  end

  test "lists active members with their admin flag" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    user3 = register("to_user3")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user3.nickname)

    {:ok, members} = GroupChats.get_members("grupo1")

    assert Enum.map(members, & &1.nickname) == ["from_user1", "to_user2", "to_user3"]
    assert Enum.find(members, &(&1.nickname == "from_user1")).is_admin
    refute Enum.find(members, &(&1.nickname == "to_user2")).is_admin
  end

  test "checks admin status of a member" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")

    assert GroupChats.is_admin?("grupo1", user1.nickname)
    refute GroupChats.is_admin?("grupo1", user2.nickname)
  end

  test "adds and removes admins, respecting membership and permission rules" do
    user1 = register("from_user1")
    user2 = register("to_user2")
    user3 = register("to_user3")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)

    {:ok, added} = GroupChats.add_admin("grupo1", user1.nickname, user2.nickname)
    assert added == "Usuario to_user2 añadido como admin al grupo"

    {:error, not_member} = GroupChats.add_admin("grupo1", user1.nickname, user3.nickname)
    assert not_member == "El usuario to_user3 no es miembro del grupo"

    {:ok, removed} = GroupChats.delete_admin("grupo1", user2.nickname, user1.nickname)
    assert removed == "Usuario from_user1 eliminado como admin del grupo"

    {:error, no_permission} = GroupChats.delete_admin("grupo1", user1.nickname, user2.nickname)
    assert no_permission == "El usuario from_user1 no tiene permiso para eliminar admins del grupo"
  end

  test "the last remaining admin auto-promotes another member when removed" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _group_chat} = GroupChats.create_group_chat(user1.nickname, "grupo1")
    {:ok, _} = GroupChats.add_member("grupo1", user1.nickname, user2.nickname)

    {:ok, message} = GroupChats.delete_admin("grupo1", user1.nickname, user1.nickname)

    assert message ==
             "Usuario from_user1 eliminado como admin del grupo y to_user2 asignado como nuevo admin."

    assert GroupChats.is_admin?("grupo1", user2.nickname)
    refute GroupChats.is_admin?("grupo1", user1.nickname)
  end
end
