alias Pomoroom.{GroupChats, Messages}

group_names = ["Química"]

Enum.each(group_names, fn group_name ->
  case GroupChats.get_by("name", group_name) do
    {:ok, group} ->
      case Messages.get_chat_messages(group.chat_id) do
        {:ok, messages} ->
          IO.puts("#{group_name}: reenviando #{length(messages)} mensajes")

          Enum.each(messages, fn msg ->
            case Messages.new_message(msg.text, msg.from_user, group.chat_id) do
              {:ok, _new_msg} ->
                IO.puts("  ok: #{msg.from_user}: #{msg.text}")

              {:error, reason} ->
                IO.puts("  error (#{msg.from_user}): #{inspect(reason)}")
            end
          end)

        {:error, reason} ->
          IO.puts("#{group_name}: no se pudieron leer los mensajes: #{inspect(reason)}")
      end

    {:error, reason} ->
      IO.puts("#{group_name}: grupo no encontrado: #{inspect(reason)}")
  end
end)
