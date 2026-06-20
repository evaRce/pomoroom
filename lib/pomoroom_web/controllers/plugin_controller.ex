defmodule PomoroomWeb.PluginController do
  use PomoroomWeb, :controller

  alias Pomoroom.ChatPlugins
  alias Pomoroom.ChatPlugins.Kanban.Kanbans

  def index(conn, _params) do
    plugins = ChatPlugins.list_available_plugins()
    json(conn, %{data: plugins})
  end

  def kanban_default_columns(conn, _params) do
    columns = Kanbans.default_columns()
    json(conn, %{data: columns})
  end
end
