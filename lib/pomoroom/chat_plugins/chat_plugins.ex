defmodule Pomoroom.ChatPlugins do
  alias Pomoroom.ChatPlugins.ChatPluginService

  defdelegate install_plugin(chat_id, chat_type, plugin_id, user_nickname), to: ChatPluginService
  defdelegate uninstall_plugin(chat_id, chat_type, plugin_id), to: ChatPluginService
  defdelegate list_installed_plugins(chat_id, chat_type), to: ChatPluginService
  defdelegate list_available_plugins(), to: ChatPluginService
  defdelegate get_plugin_data(plugin_id), to: ChatPluginService
end
