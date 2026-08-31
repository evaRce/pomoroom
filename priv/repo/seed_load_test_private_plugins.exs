alias Pomoroom.ChatPlugins.ChatPluginService
alias Pomoroom.PrivateChats

eva_nickname = "eva123"

buddy_nicknames =
  ["buddy123", "buddy124", "buddy125", "buddy126"] ++
    for n <- 5..24, do: "buddy#{122 + n}"

install_for = fn chat_id, plugin_type ->
  if ChatPluginService.plugin_installed?(chat_id, "private", plugin_type) do
    :already_installed
  else
    case ChatPluginService.install_plugin(chat_id, "private", plugin_type) do
      {:ok, _plugin} -> :installed
      {:error, reason} -> {:error, reason}
    end
  end
end

Enum.each(buddy_nicknames, fn nickname ->
  case PrivateChats.get(eva_nickname, nickname) do
    {:ok, chat} ->
      pomodoro_result = install_for.(chat.chat_id, "pomodoro")
      kanban_result = install_for.(chat.chat_id, "kanban")
      IO.puts("#{nickname}: pomodoro=#{inspect(pomodoro_result)} kanban=#{inspect(kanban_result)}")

    {:error, reason} ->
      IO.puts("#{nickname}: chat privado no encontrado (#{inspect(reason)})")
  end
end)
