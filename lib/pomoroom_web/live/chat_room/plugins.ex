defmodule PomoroomWeb.ChatLive.ChatRoom.Plugins do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Pomoroom.ChatPlugins
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats

  def handle_install_chat_plugin(chat_id, chat_type, plugin_id, user, socket) do
    case authorize_chat_access(chat_id, user.nickname) do
      :ok ->
        case ChatPlugins.install_plugin(chat_id, chat_type, plugin_id, user.nickname) do
          {:ok, plugin} ->
            payload = %{
              event_name: "chat_plugin_installed",
              event_data: %{
                chat_id: chat_id,
                chat_type: chat_type,
                plugin: plugin
              }
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            {:noreply, socket}
        end

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_uninstall_chat_plugin(chat_id, chat_type, plugin_id, user, socket) do
    case authorize_chat_access(chat_id, user.nickname) do
      :ok ->
        case ChatPlugins.uninstall_plugin(chat_id, chat_type, plugin_id) do
          {:ok, plugin} ->
            payload = %{
              event_name: "chat_plugin_uninstalled",
              event_data: %{
                chat_id: chat_id,
                chat_type: chat_type,
                plugin: plugin
              }
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            {:noreply, socket}
        end

      {:error, _reason} ->
        {:noreply, socket}
    end
  end

  def handle_get_pomodoro_plugin_config(chat_id, chat_type, user, socket) do
    case authorize_and_validate_plugin(chat_id, chat_type, "pomodoro", user.nickname) do
      :ok ->
        case PomodoroTimerService.get_config(chat_id, chat_type) do
          {:ok, timer_data} ->
            payload = %{
              event_name: "pomodoro_plugin_config_loaded",
              event_data: timer_data
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, _reason} ->
            push_pomodoro_error(socket, chat_id, chat_type, :failed_to_load_timer_config)
        end

      {:error, reason} ->
        push_pomodoro_error(socket, chat_id, chat_type, reason)
    end
  end

  def handle_update_pomodoro_plugin_config(chat_id, chat_type, config, user, socket) do
    case authorize_and_validate_plugin(chat_id, chat_type, "pomodoro", user.nickname) do
      :ok ->
        case PomodoroTimerService.update_config(chat_id, chat_type, config, user.nickname) do
          {:ok, timer_data} ->
            payload = %{
              event_name: "pomodoro_plugin_config_updated",
              event_data: timer_data
            }

            {:noreply, push_event(socket, "react", payload)}

          {:error, reason} ->
            push_pomodoro_error(socket, chat_id, chat_type, reason)
        end

      {:error, reason} ->
        push_pomodoro_error(socket, chat_id, chat_type, reason)
    end
  end

  defp authorize_and_validate_plugin(chat_id, chat_type, plugin_id, user_nickname) do
    case authorize_chat_access(chat_id, user_nickname) do
      :ok ->
        case ChatPlugins.plugin_installed?(chat_id, chat_type, plugin_id) do
          true -> :ok
          false -> {:error, :plugin_not_installed}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp push_pomodoro_error(socket, chat_id, chat_type, reason) do
    payload = %{
      event_name: "pomodoro_plugin_config_error",
      event_data: %{
        chat_id: chat_id,
        chat_type: chat_type,
        reason: reason
      }
    }

    {:noreply, push_event(socket, "react", payload)}
  end

  defp authorize_chat_access(chat_id, user_nickname) do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        case GroupChats.member_state(group_chat.name, user_nickname) do
          {:active, _joined_at} -> :ok
          _ -> {:error, :unauthorized}
        end

      {:error, _group_error} ->
        authorize_private_chat_access(chat_id, user_nickname)
    end
  end

  defp authorize_private_chat_access(chat_id, user_nickname) do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        members = private_chat.members || []

        member_ids =
          Enum.map(members, fn member ->
            member[:user_id] || member["user_id"]
          end)

        deleted_by = private_chat.deleted_by || []

        if user_nickname in member_ids and user_nickname not in deleted_by do
          :ok
        else
          {:error, :unauthorized}
        end

      {:error, _private_chat_error} ->
        {:error, :chat_not_found}
    end
  end
end
