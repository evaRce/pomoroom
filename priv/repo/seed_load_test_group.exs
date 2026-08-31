alias Pomoroom.GroupChats

eva_nickname = "eva123"
group_name = "load_test_room"

member_nicknames = for n <- 5..23, do: "buddy#{122 + n}"

case GroupChats.get_by("name", group_name) do
  {:ok, _group} ->
    IO.puts("Grupo #{group_name} ya existe")

  {:error, _reason} ->
    case GroupChats.create_group_chat(eva_nickname, group_name) do
      {:ok, _group} ->
        IO.puts("Grupo creado: #{group_name}")

      {:error, reason} ->
        IO.puts("Grupo #{group_name} no creado: #{inspect(reason)}")
    end
end

Enum.each(member_nicknames, fn nickname ->
  case GroupChats.add_member(group_name, eva_nickname, nickname) do
    {:ok, _result} ->
      IO.puts("Miembro añadido: #{nickname}")

    {:error, reason} ->
      IO.puts("Miembro #{nickname} no añadido: #{inspect(reason)}")
  end
end)
