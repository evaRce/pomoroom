alias Pomoroom.{Users, PrivateChats}

eva_nickname = "eva123"

new_buddies =
  for n <- 5..24 do
    %{
      "email" => "buddy#{n}@example.com",
      "password" => "Buddy12345",
      "password_confirmation" => "Buddy12345",
      "nickname" => "buddy#{122 + n}"
    }
  end

created_nicknames =
  Enum.map(new_buddies, fn params ->
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

Enum.each(created_nicknames, fn nickname ->
  case PrivateChats.create_private_chat(eva_nickname, nickname) do
    {:ok, _chat} ->
      IO.puts("Contacto creado: #{eva_nickname} <-> #{nickname}")

    {:error, reason} ->
      IO.puts("Contacto #{eva_nickname}-#{nickname} no creado: #{inspect(reason)}")
  end
end)
