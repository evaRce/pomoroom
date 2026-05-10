defmodule Pomoroom.ChatPlugins.ChatPluginService do
  alias Pomoroom.ChatPlugins.{ChatPluginRepository, ChatPluginSchema}
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService
  alias Pomoroom.GroupChats
  alias Pomoroom.GroupChats.GroupChatRepository
  alias Pomoroom.PrivateChats
  alias Pomoroom.PrivateChats.PrivateChatRepository

  @plugins %{
    "pomodoro" => %{
      id: "pomodoro",
      name: "Temporizador Pomodoro",
      description: "Temporizador compartido para sesiones de trabajo y descanso dentro del chat.",
      icon: "⏱️"
    },
    "kanban" => %{
      id: "kanban",
      name: "Tablero Kanban",
      description:
        "Tablero compartido para organizar tareas en columnas To Do, In Progress y Done.",
      icon: "📋"
    }
  }

  def install_plugin(chat_id, chat_type, plugin_id, user_nickname) do
    case get_plugin_data(plugin_id) do
      {:error, reason} ->
        {:error, reason}

      {:ok, plugin_data} ->
        case get_or_create_installation(chat_id, chat_type, plugin_id, user_nickname) do
          {:ok, _installation} ->
            persist_embedded_plugin(chat_id, chat_type, plugin_id)
            {:ok, plugin_data}

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  def uninstall_plugin(chat_id, chat_type, plugin_id) do
    case get_plugin_data(plugin_id) do
      {:error, reason} ->
        {:error, reason}

      {:ok, plugin_data} ->
        ChatPluginRepository.delete(chat_id, chat_type, plugin_id)
        remove_embedded_plugin(chat_id, chat_type, plugin_id)
        maybe_cleanup_plugin_data(chat_id, chat_type, plugin_id)
        {:ok, plugin_data}
    end
  end

  def plugin_installed?(chat_id, chat_type, plugin_id) do
    legacy_installed? =
      case ChatPluginRepository.get_by_chat_type_and_plugin(chat_id, chat_type, plugin_id) do
        {:ok, _installation} -> true
        {:error, :not_found} -> false
      end

    legacy_installed? or embedded_plugin_installed?(chat_id, chat_type, plugin_id)
  end

  def list_installed_plugins(chat_id, chat_type) do
    legacy_plugins =
      ChatPluginRepository.list_by_chat(chat_id, chat_type)
      |> Enum.map(fn plugin_installation ->
        Map.get(@plugins, plugin_installation.plugin_id)
      end)
      |> Enum.reject(&is_nil/1)

    embedded_plugins =
      embedded_plugin_ids(chat_id, chat_type)
      |> Enum.map(&Map.get(@plugins, &1))
      |> Enum.reject(&is_nil/1)

    merge_plugins_by_id(legacy_plugins, embedded_plugins)
  end

  def list_available_plugins do
    @plugins
    |> Map.values()
    |> Enum.sort_by(& &1.id)
  end

  def get_plugin_data(plugin_id) do
    case Map.fetch(@plugins, plugin_id) do
      {:ok, plugin_data} -> {:ok, plugin_data}
      :error -> {:error, :unsupported_plugin}
    end
  end

  defp get_or_create_installation(chat_id, chat_type, plugin_id, user_nickname) do
    case ChatPluginRepository.get_by_chat_type_and_plugin(chat_id, chat_type, plugin_id) do
      {:ok, existing} ->
        {:ok, existing}

      {:error, :not_found} ->
        create_installation(chat_id, chat_type, plugin_id, user_nickname)
    end
  end

  defp create_installation(chat_id, chat_type, plugin_id, user_nickname) do
    changeset =
      ChatPluginSchema.chat_plugin_changeset(chat_id, chat_type, plugin_id, user_nickname)

    if changeset.valid? do
      case ChatPluginRepository.create(changeset.changes) do
        {:ok, _result} -> {:ok, changeset.changes}
        {:error, _reason} -> {:error, :failed_to_install_plugin}
      end
    else
      {:error, :invalid_plugin_installation}
    end
  end

  defp maybe_cleanup_plugin_data(chat_id, chat_type, "pomodoro") do
    PomodoroTimerService.delete_timer(chat_id, chat_type)
  end

  defp maybe_cleanup_plugin_data(_chat_id, _chat_type, _plugin_id), do: :ok

  defp persist_embedded_plugin(chat_id, chat_type, plugin_id) do
    plugin = %{type: plugin_id, id: plugin_id}

    update_embedded_plugins(chat_id, chat_type, {:add, plugin})
  end

  defp remove_embedded_plugin(chat_id, chat_type, plugin_id) do
    update_embedded_plugins(chat_id, chat_type, {:remove, plugin_id})
  end

  defp update_embedded_plugins(chat_id, "group", action) do
    result =
      case action do
        {:add, plugin} -> GroupChatRepository.add_plugin(chat_id, plugin)
        {:remove, plugin_id} -> GroupChatRepository.remove_plugin(chat_id, plugin_id)
      end

    case result do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :failed_to_update_embedded_plugins}
    end
  end

  defp update_embedded_plugins(chat_id, "private", action) do
    result =
      case action do
        {:add, plugin} -> PrivateChatRepository.add_plugin(chat_id, plugin)
        {:remove, plugin_id} -> PrivateChatRepository.remove_plugin(chat_id, plugin_id)
      end

    case result do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :failed_to_update_embedded_plugins}
    end
  end

  defp embedded_plugin_installed?(chat_id, chat_type, plugin_id) do
    embedded_plugin_ids(chat_id, chat_type)
    |> Enum.any?(&(&1 == plugin_id))
  end

  defp embedded_plugin_ids(chat_id, "group") do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        (Map.get(group_chat, :plugins) || Map.get(group_chat, "plugins") || [])
        |> Enum.map(&normalize_plugin_type/1)
        |> Enum.reject(&is_nil/1)

      {:error, _reason} ->
        []
    end
  end

  defp embedded_plugin_ids(chat_id, "private") do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        (Map.get(private_chat, :plugins) || Map.get(private_chat, "plugins") || [])
        |> Enum.map(&normalize_plugin_type/1)
        |> Enum.reject(&is_nil/1)

      {:error, _reason} ->
        []
    end
  end

  defp merge_plugins_by_id(primary_plugins, secondary_plugins) do
    Enum.reduce(primary_plugins ++ secondary_plugins, [], fn plugin, acc ->
      plugin_id = Map.get(plugin, :id) || Map.get(plugin, "id")

      if Enum.any?(acc, fn existing ->
           (Map.get(existing, :id) || Map.get(existing, "id")) == plugin_id
         end) do
        acc
      else
        acc ++ [plugin]
      end
    end)
  end

  defp normalize_plugin_type(plugin) when is_map(plugin) do
    Map.get(plugin, :type) || Map.get(plugin, "type") || Map.get(plugin, :id) ||
      Map.get(plugin, "id")
  end

  defp normalize_plugin_type(_), do: nil
end
