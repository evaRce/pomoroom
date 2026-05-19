defmodule Pomoroom.ChatPlugins do
  alias Pomoroom.ChatPlugins.ChatPluginService

  defdelegate install_plugin(chat_id, chat_type, plugin_type), to: ChatPluginService
  defdelegate uninstall_plugin_by_id(chat_id, chat_type, plugin_id), to: ChatPluginService
  defdelegate list_available_plugins(), to: ChatPluginService
  defdelegate plugin_installed?(chat_id, chat_type, plugin_type), to: ChatPluginService
end
