defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerServer do
  use GenServer

  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository, as: Repository

  @plugin_id "pomodoro"
  @default_config %{
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    cycles_before_long_break: 4
  }

  def start_link(%{timer_id: timer_id} = args) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(timer_id))
  end

  def get_config(timer_id) do
    GenServer.call(via_tuple(timer_id), :get_config)
  end

  def update_config(timer_id, config, updated_by \\ nil) do
    GenServer.call(via_tuple(timer_id), {:update_config, config, updated_by})
  end

  def via_tuple(timer_id) do
    {:via, Registry, {Registry.PomodoroPluginTimer, timer_id}}
  end

  @impl true
  def init(%{timer_id: timer_id, chat_id: chat_id, chat_type: chat_type} = _args) do
    state = %{
      process_id: timer_id,
      timer_id: Ecto.UUID.generate(),
      chat_id: chat_id,
      chat_type: chat_type,
      plugin_id: @plugin_id,
      config: @default_config
    }

    {:ok, maybe_load_persisted_config(state)}
  end

  @impl true
  def handle_call(:get_config, _from, state) do
    {:reply, {:ok, format_payload(state)}, state}
  end

  @impl true
  def handle_call({:update_config, raw_config, updated_by}, _from, state) do
    config = normalize_config(raw_config)

    case persist_if_custom(config, state, updated_by) do
      :ok ->
        next_state = %{state | config: config}
        {:reply, {:ok, format_payload(next_state)}, next_state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  defp maybe_load_persisted_config(state) do
    case Repository.get_by_chat(state.chat_id, state.chat_type, state.plugin_id) do
      {:ok, timer_data} ->
        %{state | config: extract_config(timer_data), timer_id: timer_data.timer_id}

      {:error, :not_found} ->
        state
    end
  end

  defp persist_if_custom(config, state, updated_by) do
    if config == @default_config do
      Repository.delete_by_chat(state.chat_id, state.chat_type, state.plugin_id)
      :ok
    else
      changes = %{
        timer_id: state.timer_id,
        chat_id: state.chat_id,
        chat_type: state.chat_type,
        plugin_id: state.plugin_id,
        work_duration: config.work_duration,
        short_break_duration: config.short_break_duration,
        long_break_duration: config.long_break_duration,
        cycles_before_long_break: config.cycles_before_long_break,
        updated_by: updated_by || "unknown"
      }

      case Repository.upsert(changes) do
        {:ok, _result} -> :ok
        {:error, _reason} -> {:error, :failed_to_persist_config}
      end
    end
  end

  defp normalize_config(config) when is_map(config) do
    %{
      work_duration: Map.get(config, :work_duration) || Map.get(config, "work_duration"),
      short_break_duration:
        Map.get(config, :short_break_duration) || Map.get(config, "short_break_duration"),
      long_break_duration:
        Map.get(config, :long_break_duration) || Map.get(config, "long_break_duration"),
      cycles_before_long_break:
        Map.get(config, :cycles_before_long_break) ||
          Map.get(config, "cycles_before_long_break")
    }
  end

  defp normalize_config(_), do: @default_config

  defp extract_config(timer_data) do
    %{
      work_duration: timer_data.work_duration,
      short_break_duration: timer_data.short_break_duration,
      long_break_duration: timer_data.long_break_duration,
      cycles_before_long_break: timer_data.cycles_before_long_break
    }
  end

  defp format_payload(state) do
    %{
      timer_id: state.timer_id,
      chat_id: state.chat_id,
      chat_type: state.chat_type,
      plugin_id: state.plugin_id,
      config: state.config
    }
  end
end
