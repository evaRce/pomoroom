alias Pomoroom.ChatPlugins.ChatPluginService
alias Pomoroom.GroupChats

group_name = "load_test_room"

case GroupChats.get_by("name", group_name) do
  {:ok, group} ->
    if ChatPluginService.plugin_installed?(group.chat_id, "group", "kanban") do
      IO.puts("Plugin kanban ya instalado en #{group_name}")
    else
      case ChatPluginService.install_plugin(group.chat_id, "group", "kanban") do
        {:ok, _plugin} ->
          IO.puts("Plugin kanban instalado en #{group_name}")

        {:error, reason} ->
          IO.puts("No se pudo instalar kanban en #{group_name}: #{inspect(reason)}")
      end
    end

  {:error, reason} ->
    IO.puts("Grupo #{group_name} no encontrado: #{inspect(reason)}")
end
