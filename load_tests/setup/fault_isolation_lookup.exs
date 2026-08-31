{:ok, group} = Pomoroom.GroupChats.get_by("name", "load_test_room")
{:ok, private_chat} = Pomoroom.PrivateChats.get("eva123", "buddy124")

IO.puts("ROOM_A_CHAT_ID=#{group.chat_id}")
IO.puts("ROOM_B_CHAT_ID=#{private_chat.chat_id}")
