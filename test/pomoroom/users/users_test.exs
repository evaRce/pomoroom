defmodule Pomoroom.UsersTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.{PrivateChats, Users}

  defp register(nickname, email \\ nil) do
    Users.register_user(%{
      email: email || "#{nickname}@h.es",
      nickname: nickname,
      password: "password_1",
      password_confirmation: "password_1"
    })
  end

  test "registers a user with a hashed password and a default image" do
    {:ok, user} = register("from_user1")

    assert user.email == "from_user1@h.es"
    assert user.nickname == "from_user1"
    assert user.password != "password_1"
    assert String.match?(user.image_profile, ~r/^\/images\/default_user\/default_user-.*\.svg$/)
  end

  test "rejects registration with invalid attributes" do
    {:error, errors} = Users.register_user(%{email: "not-an-email", nickname: "ab", password: "short"})

    assert %{email: _, nickname: _, password: _} = errors
  end

  test "fails when two users register with the same email" do
    {:ok, _user1} = register("from_user1")
    {:error, error} = register("from_user2", "from_user1@h.es")

    assert error == %{email: "Este email ya está siendo usado"}
  end

  test "fails when two users register with the same nickname" do
    {:ok, _user1} = register("from_user1")
    {:error, error} =
      Users.register_user(%{
        email: "other@h.es",
        nickname: "from_user1",
        password: "password_2",
        password_confirmation: "password_2"
      })

    assert error == %{nickname: "Este nickname ya está asociado a otra cuenta"}
  end

  test "retrieves a user by any exact field match, without exposing the password" do
    {:ok, user} = register("from_user1")

    {:ok, by_email} = Users.get_by("email", user.email)
    {:ok, by_nickname} = Users.get_by("nickname", user.nickname)

    assert by_email.nickname == user.nickname
    assert by_nickname.email == user.email
    refute Map.has_key?(by_email, :password)
  end

  test "returns not_found when no user matches the field" do
    assert Users.get_by("nickname", "missing_user") == {:error, :not_found}
  end

  test "retrieves the stored password hash through get_with_passw" do
    {:ok, user} = register("from_user1")

    {:ok, with_passw} = Users.get_with_passw("nickname", user.nickname)

    assert with_passw.password == user.password
  end

  test "retrieves several users at once by a shared field" do
    {:ok, user1} = register("from_user1")
    {:ok, user2} = register("to_user2")

    users_by_nickname = Users.get_many_by("nickname", [user1.nickname, user2.nickname, "missing"])

    assert map_size(users_by_nickname) == 2
    assert users_by_nickname[user1.nickname].email == user1.email
    assert users_by_nickname[user2.nickname].email == user2.email
  end

  test "checks nickname existence" do
    {:ok, user} = register("from_user1")

    assert Users.exists_nickname?(user.nickname)
    refute Users.exists_nickname?("missing_user")
  end

  test "lists private chat contacts with their associated chat id" do
    {:ok, user1} = register("from_user1")
    {:ok, user2} = register("to_user2")

    assert Users.get_contacts(user1.nickname) == {:ok, []}

    {:ok, private_chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    {:ok, [contact]} = Users.get_contacts(user1.nickname)

    assert contact.nickname == user2.nickname
    assert contact.chat_id == private_chat.chat_id
  end
end
