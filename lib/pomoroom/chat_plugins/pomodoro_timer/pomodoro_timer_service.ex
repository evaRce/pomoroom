defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService do
  alias Pomoroom.ChatPlugins.ChatPluginService
  alias Pomoroom.ChatPlugins.PomodoroTimer.Runtime.{PomodoroTimerServer, Runtime}
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats

  @default_config %{
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    cycles_before_long_break: 4
  }

  def create_timer(timer_id) do
    changes = %{
      timer_id: timer_id,
      work_duration: @default_config.work_duration,
      short_break_duration: @default_config.short_break_duration,
      long_break_duration: @default_config.long_break_duration,
      cycles_before_long_break: @default_config.cycles_before_long_break
    }

    case PomodoroTimerRepository.create(changes) do
      {:ok, _result} -> {:ok, changes}
      {:error, reason} -> {:error, reason}
    end
  end

  def get_config(chat_id, chat_type) do
    case ensure_started(chat_id, chat_type) do
      {:ok, process_id} ->
        PomodoroTimerServer.get_config(process_id)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def ensure_started(chat_id, chat_type) do
    case resolve_timer_id(chat_id, chat_type) do
      nil ->
        {:error, :plugin_not_installed}

      timer_id ->
        start_timer(chat_id, chat_type, timer_id)
    end
  end

  def start_timer(chat_id, chat_type, timer_id) do
    Runtime.ensure_timer_process_started(
      process_id(chat_id, chat_type),
      chat_id,
      chat_type,
      timer_id
    )
  end

  def update_config(chat_id, chat_type, config) do
    case ensure_started(chat_id, chat_type) do
      {:ok, process_id} ->
        PomodoroTimerServer.update_config(process_id, config)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def terminate_timer_process(chat_id, chat_type) do
    Runtime.terminate_timer_process(process_id(chat_id, chat_type))
  end

  def delete_timer_for_chat(chat_id, chat_type) do
    case resolve_timer_id(chat_id, chat_type) do
      nil ->
        terminate_timer_process(chat_id, chat_type)

      timer_id ->
        delete_timer_instance(timer_id, chat_id, chat_type)
    end
  end

  def delete_timer_instance(timer_id, chat_id, chat_type) do
    PomodoroTimerRepository.delete_by_timer_id(timer_id)
    terminate_timer_process(chat_id, chat_type)
  end

  defp process_id(chat_id, chat_type) do
    "pomodoro:#{chat_type}:#{chat_id}"
  end

  defp resolve_timer_id(chat_id, "group") do
    case GroupChats.get_by("chat_id", chat_id) do
      {:ok, group_chat} ->
        plugin_instance_id(ChatPluginService.get_plugins_from_chat(group_chat))

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_timer_id(chat_id, "private") do
    case PrivateChats.get(chat_id) do
      {:ok, private_chat} ->
        plugin_instance_id(ChatPluginService.get_plugins_from_chat(private_chat))

      {:error, _reason} ->
        nil
    end
  end

  defp resolve_timer_id(_chat_id, _chat_type), do: nil

  defp plugin_instance_id(plugins) when is_list(plugins) do
    pomodoro_plugin =
      Enum.find(plugins, fn plugin ->
        plugin_type = Map.get(plugin, :type) || Map.get(plugin, "type")
        plugin_type == "pomodoro"
      end)

    case pomodoro_plugin do
      nil ->
        nil

      plugin ->
        Map.get(plugin, :id) || Map.get(plugin, "id")
    end
  end

  defp plugin_instance_id(_), do: nil
end
