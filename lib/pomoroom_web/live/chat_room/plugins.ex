defmodule PomoroomWeb.ChatLive.ChatRoom.Plugins do
  import Phoenix.LiveView, only: [push_event: 3]

  alias Pomoroom.ChatPlugins
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
