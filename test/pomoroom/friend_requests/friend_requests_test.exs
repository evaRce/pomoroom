defmodule Pomoroom.FriendRequestsTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.{FriendRequests, Users}

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

  test "sends a friend request between two registered users" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert request.status == "pending"
    assert request.from_user == "from_user1"
    assert request.to_user == "to_user2"
  end

  test "rejects sending a friend request to oneself" do
    user1 = register("from_user1")

    {:error, error} = FriendRequests.send_friend_request(user1.nickname, user1.nickname)

    assert error == %{error: "No puedes añadirte a ti mismo como un contacto"}
  end

  test "rejects sending a friend request to a user that does not exist" do
    user1 = register("from_user1")

    {:error, error} = FriendRequests.send_friend_request("missing_user", user1.nickname)

    assert error == %{error: "El usuario missing_user no existe"}
  end

  test "rejects a duplicate friend request between the same two users" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _first} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)
    {:error, error} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert error == %{error: "Ya hay una petición de amistad entre to_user2 y from_user1"}
  end

  test "only the recipient can accept the request, creating a private chat" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    {:error, unauthorized} =
      FriendRequests.accept_friend_request(user2.nickname, user1.nickname, user1.nickname)

    assert unauthorized == %{error: "No autorizado para aceptar esta solicitud de amistad"}

    {:ok, accepted} =
      FriendRequests.accept_friend_request(user2.nickname, user1.nickname, user2.nickname)

    assert accepted.status == "accepted"

    {:error, already_accepted} =
      FriendRequests.accept_friend_request(user2.nickname, user1.nickname, user2.nickname)

    assert already_accepted == %{error: "Petición de amistad ya aceptada"}
  end

  test "retrieves and reports missing friend request data" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    assert FriendRequests.get(user2.nickname, user1.nickname) == {:error, :not_found}

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)
    {:ok, request} = FriendRequests.get(user2.nickname, user1.nickname)

    assert request.status == "pending"
  end

  test "checks ownership of a friend request" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert FriendRequests.is_owner_request?(user2.nickname, user1.nickname)
    refute FriendRequests.is_owner_request?(user1.nickname, user2.nickname)
  end

  test "only the recipient can reject, and a rejected request cannot be rejected again" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    {:error, unauthorized} =
      FriendRequests.reject_friend_request(user2.nickname, user1.nickname, user1.nickname)

    assert unauthorized == %{error: "No autorizado para rechazar esta solicitud de amistad"}

    {:ok, rejected} = FriendRequests.reject_friend_request(user2.nickname, user1.nickname, user2.nickname)
    assert rejected.status == "rejected"

    {:error, already_rejected} =
      FriendRequests.reject_friend_request(user2.nickname, user1.nickname, user2.nickname)

    assert already_rejected == %{error: "Petición de amistad ya rechazada"}
  end

  test "deletes a friend request" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert FriendRequests.delete_request(user2.nickname, user1.nickname) == :ok
    assert FriendRequests.get(user2.nickname, user1.nickname) == {:error, :not_found}
  end

  test "tracks whether a request is still pending" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)
    assert FriendRequests.request_is_pending?(user2.nickname, user1.nickname)

    {:ok, _rejected} = FriendRequests.reject_friend_request(user2.nickname, user1.nickname, user2.nickname)
    refute FriendRequests.request_is_pending?(user2.nickname, user1.nickname)
  end

  test "reports the status regardless of argument order, and :not_found otherwise" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert FriendRequests.get_status(user2.nickname, user1.nickname) == "pending"
    assert FriendRequests.get_status(user1.nickname, user2.nickname) == "pending"
    assert FriendRequests.get_status("missing_user", user2.nickname) == :not_found
  end

  test "checks existence of a friend request between two users" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert FriendRequests.exists?(user2.nickname, user1.nickname)
    refute FriendRequests.exists?("missing_user", user2.nickname)
  end

  test "determines the (to_user, from_user) pair regardless of argument order" do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, _request} = FriendRequests.send_friend_request(user2.nickname, user1.nickname)

    assert FriendRequests.determine_friend_request_users(user2.nickname, user1.nickname) ==
             {"to_user2", "from_user1"}

    assert FriendRequests.determine_friend_request_users(user1.nickname, user2.nickname) ==
             {"to_user2", "from_user1"}
  end
end
