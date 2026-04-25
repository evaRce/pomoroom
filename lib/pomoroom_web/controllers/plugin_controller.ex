defmodule PomoroomWeb.PluginController do
  use PomoroomWeb, :controller

  alias Pomoroom.ChatPlugins

  def index(conn, _params) do
    plugins = ChatPlugins.list_available_plugins()
    json(conn, %{data: plugins})
  end
end
