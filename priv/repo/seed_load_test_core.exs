alias Pomoroom.{Users, FriendRequests}

eva = %{
  "email" => "eva@gmail.com",
  "password" => "eva12345",
  "password_confirmation" => "eva12345",
  "nickname" => "eva123"
}

original_buddies = [
  %{"email" => "buddy@example.com", "password" => "Buddy12345", "password_confirmation" => "Buddy12345", "nickname" => "buddy123"},
  %{"email" => "buddy2@example.com", "password" => "Buddy12345", "password_confirmation" => "Buddy12345", "nickname" => "buddy124"},
  %{"email" => "buddy3@example.com", "password" => "Buddy12345", "password_confirmation" => "Buddy12345", "nickname" => "buddy125"},
  %{"email" => "buddy4@example.com", "password" => "Buddy12345", "password_confirmation" => "Buddy12345", "nickname" => "buddy126"}
]

case Users.register_user(eva) do
  {:ok, user} -> IO.puts("Usuario creado: #{user.nickname}")
  {:error, reason} -> IO.puts("Usuario eva123 no creado: #{inspect(reason)}")
end

created_nicknames =
  Enum.map(original_buddies, fn params ->
    case Users.register_user(params) do
      {:ok, user} ->
        IO.puts("Usuario creado: #{user.nickname}")
        user.nickname

      {:error, reason} ->
        IO.puts("Usuario #{params["nickname"]} no creado: #{inspect(reason)}")
        nil
    end
  end)
  |> Enum.reject(&is_nil/1)

eva_nickname = "eva123"

Enum.each(created_nicknames, fn nickname ->
  case FriendRequests.send_friend_request(nickname, eva_nickname) do
    {:ok, _request} ->
      case FriendRequests.accept_friend_request(nickname, eva_nickname, nickname) do
        {:ok, _accepted} -> IO.puts("Contacto creado: #{eva_nickname} <-> #{nickname}")
        {:error, reason} -> IO.puts("Solicitud no aceptada #{eva_nickname}-#{nickname}: #{inspect(reason)}")
      end

    {:error, reason} ->
      IO.puts("Solicitud no creada #{eva_nickname}-#{nickname}: #{inspect(reason)}")
  end
end)
