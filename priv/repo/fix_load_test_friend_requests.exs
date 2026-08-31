alias Pomoroom.FriendRequests

eva_nickname = "eva123"

buddy_nicknames = for n <- 5..24, do: "buddy#{122 + n}"

Enum.each(buddy_nicknames, fn nickname ->
  case FriendRequests.send_friend_request(nickname, eva_nickname) do
    {:ok, _request} ->
      case FriendRequests.accept_friend_request(nickname, eva_nickname, nickname) do
        {:ok, _accepted} ->
          IO.puts("#{nickname}: solicitud creada y aceptada")

        {:error, reason} ->
          IO.puts("#{nickname}: solicitud creada pero no aceptada (#{inspect(reason)})")
      end

    {:error, reason} ->
      IO.puts("#{nickname}: solicitud no creada (#{inspect(reason)})")
  end
end)
