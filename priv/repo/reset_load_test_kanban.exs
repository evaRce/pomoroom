alias Pomoroom.ChatPlugins.ChatPluginService
alias Pomoroom.GroupChats

group_name = "load_test_room"

{:ok, group} = GroupChats.get_by("name", group_name)
plugins = ChatPluginService.get_plugins_from_chat(group)
kanban_plugin = Enum.find(plugins, fn p -> Map.get(p, "type") == "kanban" or Map.get(p, :type) == "kanban" end)

if kanban_plugin do
  plugin_id = Map.get(kanban_plugin, "id") || Map.get(kanban_plugin, :id)
  {:ok, _} = ChatPluginService.uninstall_plugin_by_id(group.chat_id, "group", plugin_id)
  IO.puts("Plugin kanban desinstalado de #{group_name}")
end

{:ok, _} = ChatPluginService.install_plugin(group.chat_id, "group", "kanban")
IO.puts("Plugin kanban reinstalado en #{group_name} (tablero vacío)")
