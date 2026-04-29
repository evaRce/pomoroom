defmodule Pomoroom.ChatPlugins.ChatPluginRepository do
  alias Pomoroom.ChatPlugins.ChatPluginSchema

  @collection "chat_plugins"

  def create(changes) do
    Mongo.insert_one(:mongo, @collection, changes)
  end

  def get_by_chat_type_and_plugin(chat_id, chat_type, plugin_id) do
    query = %{"chat_id" => chat_id, "chat_type" => chat_type, "plugin_id" => plugin_id}

    case Mongo.find_one(:mongo, @collection, query) do
      nil ->
        {:error, :not_found}

      plugin_installation when is_map(plugin_installation) ->
        {:ok, get_changes_from_changeset(plugin_installation)}
    end
  end

  def list_by_chat(chat_id, chat_type) do
    query = %{"chat_id" => chat_id, "chat_type" => chat_type}

    Mongo.find(:mongo, @collection, query)
    |> Enum.to_list()
    |> Enum.map(fn plugin -> get_changes_from_changeset(plugin) end)
  end

  def delete(chat_id, chat_type, plugin_id) do
    query = %{"chat_id" => chat_id, "chat_type" => chat_type, "plugin_id" => plugin_id}
    Mongo.delete_one(:mongo, @collection, query)
  end

  def delete_all() do
    Mongo.delete_many(:mongo, @collection, %{})
  end

  def get_changes_from_changeset(args) do
    ChatPluginSchema.chat_plugin_changeset(args).changes
  end
end
