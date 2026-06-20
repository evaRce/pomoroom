defmodule Pomoroom.ChatPlugins.ChatPluginService do
  alias Pomoroom.ChatPlugins.Kanban.Kanbans
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimers
  alias Pomoroom.GroupChats
  alias Pomoroom.GroupChats.GroupChatRepository
  alias Pomoroom.PrivateChats
  alias Pomoroom.PrivateChats.PrivateChatRepository

  @plugin_catalog %{
    "pomodoro" => %{
      name: "Temporizador Pomodoro",
      description: "Temporizador compartido para sesiones de trabajo y descanso dentro del chat.",
      icon: "⏱️",
      installable: true
    },
    "kanban" => %{
      name: "Tablero Kanban",
      description:
        "Tablero compartido para organizar tareas en columnas To Do, In Progress y Done.",
      icon: "📋",
      installable: true
    }
  }

  def install_plugin(chat_id, chat_type, plugin_type) do
    case plugin_type do
      "pomodoro" -> install_pomodoro_plugin(chat_id, chat_type)
      "kanban" -> install_kanban_plugin(chat_id, chat_type)
      _ -> {:error, :unsupported_plugin}
    end
  end

  def uninstall_plugin_by_id(chat_id, chat_type, plugin_id) do
    case resolve_embedded_plugin_by_id(chat_id, chat_type, plugin_id) do
      nil ->
        {:error, :plugin_not_installed}

      plugin ->
        uninstall_embedded_plugin(chat_id, chat_type, plugin)
    end
  end

  def start_plugins_for_chat(chat_id, chat_type) do
    case resolve_chat(chat_id, chat_type) do
      {:ok, chat} ->
        get_plugins_from_chat(chat)
        |> Enum.reduce(:ok, fn plugin, acc ->
          case acc do
            :ok ->
              case start_plugin_instance(chat_id, chat_type, plugin) do
                {:error, _} = error -> error
                _ -> :ok
              end

            {:error, _} = error -> error
          end
        end)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def plugin_installed?(chat_id, chat_type, plugin_type) do
    embedded_plugin_installed?(chat_id, chat_type, plugin_type)
  end

  def list_available_plugins do
    @plugin_catalog
    |> Enum.map(fn {plugin_type, plugin_data} -> Map.put(plugin_data, :type, plugin_type) end)
    |> Enum.sort_by(& &1.type)
  end

  def get_plugins_from_chat(chat) when is_map(chat) do
    Map.get(chat, :plugins) || Map.get(chat, "plugins") || []
  end

  defp install_pomodoro_plugin(chat_id, chat_type) do
    if embedded_plugin_installed?(chat_id, chat_type, "pomodoro") do
      {:error, :plugin_already_installed}
    else
      timer_id = PomodoroTimers.generate_timer_id()

      case PomodoroTimers.create_timer(timer_id) do
        {:ok, _timer} ->
          plugin_instance = %{id: timer_id, type: "pomodoro"}

          case persist_embedded_plugin(chat_id, chat_type, plugin_instance) do
            :ok ->
              case PomodoroTimers.start_timer(chat_id, chat_type, timer_id) do
                {:ok, _process_id} ->
                  {:ok, plugin_instance}

                {:error, reason} ->
                  PomodoroTimers.delete_timer_instance(timer_id, chat_id, chat_type)
                  remove_embedded_plugin(chat_id, chat_type, "pomodoro")
                  {:error, reason}
              end

            {:error, _} = err ->
              PomodoroTimers.delete_timer_instance(timer_id, chat_id, chat_type)
              err
          end

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp install_kanban_plugin(chat_id, chat_type) do
    if embedded_plugin_installed?(chat_id, chat_type, "kanban") do
      {:error, :plugin_already_installed}
    else
      kanban_id = Kanbans.generate_kanban_id()

      case Kanbans.create_kanban_board(kanban_id) do
        {:ok, _board} ->
          plugin_instance = %{id: kanban_id, type: "kanban"}

          case persist_embedded_plugin(chat_id, chat_type, plugin_instance) do
            :ok ->
              case Kanbans.start_kanban_process(chat_id, chat_type, kanban_id) do
                {:ok, _process_id} ->
                  {:ok, plugin_instance}

                {:error, reason} ->
                  remove_embedded_plugin(chat_id, chat_type, "kanban")
                  Kanbans.delete_kanban_instance(kanban_id, chat_id, chat_type)
                  {:error, reason}
              end

            {:error, _} = err ->
              Kanbans.delete_kanban_instance(kanban_id, chat_id, chat_type)
              err
          end

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp uninstall_embedded_plugin(chat_id, chat_type, plugin) when is_map(plugin) do
    plugin_type = normalize_plugin_type(plugin)
    plugin_id = Map.get(plugin, :id) || Map.get(plugin, "id")

    case plugin_type do
      "pomodoro" ->
        PomodoroTimers.delete_timer_instance(plugin_id, chat_id, chat_type)

        case remove_embedded_plugin(chat_id, chat_type, plugin_type) do
          :ok ->
            {:ok, %{id: plugin_id, type: plugin_type}}

          {:error, _} = err ->
            err
        end

      "kanban" ->
        case Kanbans.delete_kanban_instance(plugin_id, chat_id, chat_type) do
          {:ok, _board} ->
            case remove_embedded_plugin(chat_id, chat_type, plugin_type) do
              :ok ->
                {:ok, %{id: plugin_id, type: plugin_type}}

              {:error, _} = err ->
                err
            end

          {:error, _} = err ->
            err
        end

      _ ->
        {:error, :unsupported_plugin}
    end
  end

  defp uninstall_embedded_plugin(_chat_id, _chat_type, _plugin), do: {:error, :unsupported_plugin}

  defp persist_embedded_plugin(chat_id, chat_type, plugin) do
    plugin_to_store = Map.take(plugin, [:id, :type])

    update_embedded_plugins(chat_id, chat_type, {:add, plugin_to_store})
  end

  defp remove_embedded_plugin(chat_id, chat_type, plugin_type) do
    update_embedded_plugins(chat_id, chat_type, {:remove, plugin_type})
  end

  defp update_embedded_plugins(chat_id, "group", action) do
    result =
      case action do
        {:add, plugin} -> GroupChatRepository.add_plugin(chat_id, plugin)
        {:remove, plugin_type} -> GroupChatRepository.remove_plugin(chat_id, plugin_type)
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
        {:remove, plugin_type} -> PrivateChatRepository.remove_plugin(chat_id, plugin_type)
      end

    case result do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :failed_to_update_embedded_plugins}
    end
  end

  defp embedded_plugin_installed?(chat_id, chat_type, plugin_type) do
    plugin_type in embedded_plugin_ids(chat_id, chat_type)
  end

  defp resolve_embedded_plugin_by_id(chat_id, "group", plugin_id) do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        get_plugins_from_chat(group_chat)
        |> Enum.find(fn plugin -> normalize_plugin_id(plugin) == plugin_id end)

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_embedded_plugin_by_id(chat_id, "private", plugin_id) do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        get_plugins_from_chat(private_chat)
        |> Enum.find(fn plugin -> normalize_plugin_id(plugin) == plugin_id end)

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_embedded_plugin_by_id(_chat_id, _chat_type, _plugin_id), do: nil

  defp embedded_plugin_ids(chat_id, "group") do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        get_plugins_from_chat(group_chat)
        |> Enum.map(&normalize_plugin_type/1)
        |> Enum.reject(&is_nil/1)

      {:error, _reason} ->
        []
    end
  end

  defp embedded_plugin_ids(chat_id, "private") do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        get_plugins_from_chat(private_chat)
        |> Enum.map(&normalize_plugin_type/1)
        |> Enum.reject(&is_nil/1)

      {:error, _reason} ->
        []
    end
  end

  defp resolve_chat(chat_id, "group") do
    GroupChats.get_by("chat_id", chat_id)
  end

  defp resolve_chat(chat_id, "private") do
    PrivateChats.get(chat_id)
  end

  defp resolve_chat(_chat_id, _chat_type), do: {:error, :chat_not_found}

  defp start_plugin_instance(chat_id, chat_type, plugin) when is_map(plugin) do
    plugin_type = normalize_plugin_type(plugin)

    case plugin_type do
      "kanban" -> Kanbans.ensure_started(chat_id, chat_type)
      "pomodoro" -> PomodoroTimers.ensure_started(chat_id, chat_type)
      _ -> :ok
    end
  end

  defp start_plugin_instance(_chat_id, _chat_type, _plugin), do: :ok

  defp normalize_plugin_type(plugin) when is_map(plugin) do
    Map.get(plugin, :type) || Map.get(plugin, "type")
  end

  defp normalize_plugin_type(_), do: nil

  defp normalize_plugin_id(plugin) when is_map(plugin) do
    Map.get(plugin, :id) || Map.get(plugin, "id")
  end

  defp normalize_plugin_id(_), do: nil
end
