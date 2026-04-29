defmodule Pomoroom.ChatPlugins.ChatPluginService do
  alias Pomoroom.ChatPlugins.{ChatPluginRepository, ChatPluginSchema}
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService

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
        maybe_cleanup_plugin_data(chat_id, chat_type, plugin_id)
        {:ok, plugin_data}
    end
  end

  def plugin_installed?(chat_id, chat_type, plugin_id) do
    case ChatPluginRepository.get_by_chat_type_and_plugin(chat_id, chat_type, plugin_id) do
      {:ok, _installation} -> true
      {:error, :not_found} -> false
    end
  end

  def list_installed_plugins(chat_id, chat_type) do
    ChatPluginRepository.list_by_chat(chat_id, chat_type)
    |> Enum.map(fn plugin_installation ->
      plugin_id = plugin_installation.plugin_id
      Map.get(@plugins, plugin_id)
    end)
    |> Enum.reject(&is_nil/1)
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
end
