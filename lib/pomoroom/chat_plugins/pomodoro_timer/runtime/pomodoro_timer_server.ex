defmodule Pomoroom.ChatPlugins.PomodoroTimer.Runtime.PomodoroTimerServer do
  use GenServer

  alias Phoenix.PubSub
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository, as: Repository

  @default_config %{
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    cycles_before_long_break: 4
  }

  def start_link(%{process_id: process_id} = args) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(process_id))
  end

  def get_state(process_id) do
    GenServer.call(via_tuple(process_id), :get_state)
  end

  def update_config(process_id, config, expected_config_version) do
    GenServer.call(via_tuple(process_id), {:update_config, config, expected_config_version})
  end

  def start_timer(process_id) do
    GenServer.call(via_tuple(process_id), :start)
  end

  def pause_timer(process_id) do
    GenServer.call(via_tuple(process_id), :pause)
  end

  def reset_timer(process_id) do
    GenServer.call(via_tuple(process_id), :reset)
  end

  def set_mode(process_id, mode) do
    GenServer.call(via_tuple(process_id), {:set_mode, mode})
  end

  def via_tuple(process_id) do
    {:via, Registry, {Registry.PomodoroPluginTimer, process_id}}
  end

  @impl true
  def init(%{process_id: process_id, chat_id: chat_id, chat_type: chat_type, timer_id: timer_id}) do
    state =
      %{
        process_id: process_id,
        timer_id: timer_id,
        chat_id: chat_id,
        chat_type: chat_type,
        config: @default_config,
        config_version: 0,
        timer_ref: nil,
        started_at: nil,
        paused_at: nil
      }
      |> apply_persisted_state()

    state = if state.is_running, do: schedule_tick(state), else: state

    {:ok, state}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, {:ok, format_payload(state)}, state}
  end

  @impl true
  def handle_call({:update_config, raw_config, expected_config_version}, _from, state) do
    config = normalize_config(raw_config)
    expected_version = normalize_config_version(expected_config_version)

    case expected_version do
      {:ok, parsed_version} ->
        update_config_with_optimistic_lock(state, config, parsed_version)

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call(:start, _from, state) do
    case state.is_running do
      true ->
        {:reply, {:ok, format_payload(state)}, state}

      false ->
        now = now_ms()
        mode_duration_ms = mode_duration(state.config, state.mode) * 1000

        started_at =
          case state.paused_at do
            nil ->
              now

            _paused_at ->
              remaining_ms = state.time_left * 1000
              now - max(mode_duration_ms - remaining_ms, 0)
          end

        next_state =
          state
          |> Map.put(:is_running, true)
          |> Map.put(:last_completed_mode, nil)
          |> Map.put(:last_updated, now)
          |> Map.put(:started_at, started_at)
          |> Map.put(:paused_at, nil)
          |> schedule_tick()

        broadcast_state(next_state, :start_timer)
        {:reply, {:ok, format_payload(next_state)}, next_state}
    end
  end

  @impl true
  def handle_call(:pause, _from, state) do
    case state.is_running do
      false ->
        {:reply, {:ok, format_payload(state)}, state}

      true ->
        now = now_ms()
        elapsed_secs = div(max(now - state.last_updated, 0), 1000)
        remaining = max(state.time_left - elapsed_secs, 0)

        next_state =
          state
          |> cancel_pending_tick()
          |> Map.put(:is_running, false)
          |> Map.put(:time_left, remaining)
          |> Map.put(:paused_at, now)
          |> Map.put(:started_at, state.started_at || now)
          |> Map.put(:last_completed_mode, nil)
          |> Map.put(:last_updated, now)

        broadcast_state(next_state, :pause_timer)
        {:reply, {:ok, format_payload(next_state)}, next_state}
    end
  end

  @impl true
  def handle_call(:reset, _from, state) do
    now = now_ms()

    next_state =
      reset_runtime_for_config(%{
        cancel_pending_tick(state)
        | is_running: false,
          last_updated: now
      })

    broadcast_state(next_state, :reset_timer)
    {:reply, {:ok, format_payload(next_state)}, next_state}
  end

  @impl true
  def handle_call({:set_mode, requested_mode}, _from, state) do
    case valid_mode?(requested_mode) do
      true when state.is_running == false ->
        next_state =
          state
          |> cancel_pending_tick()
          |> set_mode_state(requested_mode)
          |> Map.put(:started_at, nil)
          |> Map.put(:paused_at, nil)

        broadcast_state(next_state, :set_mode)
        {:reply, {:ok, format_payload(next_state)}, next_state}

      true ->
        {:reply, {:ok, format_payload(state)}, state}

      false ->
        {:reply, {:error, :invalid_mode}, state}
    end
  end

  @impl true
  def handle_info(:tick, state) do
    case state.is_running do
      false ->
        {:noreply, %{state | timer_ref: nil}}

      true ->
        next_state =
          state
          |> Map.put(:timer_ref, nil)
          |> advance_tick()

        if next_state.is_running == false do
          broadcast_state(next_state, :timer_finished)
        end

        if next_state.is_running do
          next_state = schedule_tick(next_state)
          {:noreply, next_state}
        else
          {:noreply, next_state}
        end
    end
  end

  defp apply_persisted_state(state) do
    case Repository.get_by_timer_id(state.timer_id) do
      {:ok, timer_data} ->
        reset_runtime_for_config(%{
          state
          | config: extract_config(timer_data),
            config_version: extract_config_version(timer_data)
        })

      {:error, :not_found} ->
        reset_runtime_for_config(state)
    end
  end

  defp update_config_with_optimistic_lock(state, config, expected_version) do
    case Repository.get_by_timer_id(state.timer_id) do
      {:ok, timer_data} ->
        current_version = extract_config_version(timer_data)

        case current_version == expected_version do
          true ->
            case Repository.update_config_if_version_matches(
                   state.timer_id,
                   config,
                   expected_version
                 ) do
              {:ok, _updated} ->
                next_state =
                  reset_runtime_for_config(%{
                    cancel_pending_tick(state)
                    | config: config,
                      config_version: expected_version + 1
                  })

                broadcast_state(next_state, :update_config)
                {:reply, {:ok, format_payload(next_state)}, next_state}

              {:error, :version_conflict} ->
                {:reply, {:error, :version_conflict}, state}
            end

          false ->
            {:reply, {:error, :version_conflict}, state}
        end

      {:error, :not_found} ->
        {:reply, {:error, :timer_not_found}, state}
    end
  end

  defp reset_runtime_for_config(state) do
    state
    |> Map.put(:mode, "work")
    |> Map.put(:time_left, mode_duration(state.config, "work"))
    |> Map.put(:is_running, false)
    |> Map.put(:timer_ref, nil)
    |> Map.put(:started_at, nil)
    |> Map.put(:paused_at, nil)
    |> Map.put(:cycles_completed, 0)
    |> Map.put(:has_pending_work_half_cycle, false)
    |> Map.put(:last_completed_mode, nil)
    |> Map.put(:last_updated, now_ms())
  end

  defp set_mode_state(state, requested_mode) do
    base_state =
      state
      |> Map.put(:mode, requested_mode)
      |> Map.put(:time_left, mode_duration(state.config, requested_mode))
      |> Map.put(:has_pending_work_half_cycle, false)
      |> Map.put(:last_completed_mode, nil)
      |> Map.put(:last_updated, now_ms())

    if requested_mode == "work" do
      base_state
      |> Map.put(:cycles_completed, 0)
    else
      base_state
    end
  end

  defp advance_tick(state) do
    next_time_left = max(state.time_left - 1, 0)

    if next_time_left == 0 do
      advance_completed_timer(state)
    else
      %{state | time_left: next_time_left, last_updated: now_ms()}
    end
  end

  defp advance_completed_timer(state) do
    case state.mode do
      "work" ->
        next_mode =
          if rem(state.cycles_completed + 1, state.config.cycles_before_long_break) == 0 do
            "longBreak"
          else
            "shortBreak"
          end

        %{
          state
          | mode: next_mode,
            time_left: mode_duration(state.config, next_mode),
            is_running: false,
            has_pending_work_half_cycle: true,
            last_completed_mode: "work",
            last_updated: now_ms()
        }

      _break_mode ->
        %{
          state
          | mode: "work",
            time_left: mode_duration(state.config, "work"),
            is_running: false,
            cycles_completed: state.cycles_completed + 1,
            has_pending_work_half_cycle: false,
            last_completed_mode: state.mode,
            last_updated: now_ms()
        }
    end
  end

  defp mode_duration(config, "work"), do: config.work_duration * 60
  defp mode_duration(config, "shortBreak"), do: config.short_break_duration * 60
  defp mode_duration(config, "longBreak"), do: config.long_break_duration * 60

  defp valid_mode?("work"), do: true
  defp valid_mode?("shortBreak"), do: true
  defp valid_mode?("longBreak"), do: true
  defp valid_mode?(_), do: false

  defp schedule_tick(state) do
    state = cancel_pending_tick(state)
    timer_ref = Process.send_after(self(), :tick, 1000)
    %{state | timer_ref: timer_ref}
  end

  defp cancel_pending_tick(state) do
    case state.timer_ref do
      nil ->
        state

      timer_ref ->
        Process.cancel_timer(timer_ref)
        %{state | timer_ref: nil}
    end
  end

  defp broadcast_state(state, event_name) do
    PubSub.broadcast(
      Pomoroom.PubSub,
      timer_topic(state.chat_id),
      {event_name, format_payload(state)}
    )
  end

  defp now_ms do
    System.system_time(:millisecond)
  end

  defp format_payload(state) do
    duration_ms = mode_duration(state.config, state.mode) * 1000
    server_now = now_ms()

    %{
      timer_id: state.timer_id,
      chat_id: state.chat_id,
      chat_type: state.chat_type,
      config_version: state.config_version,
      server_now: server_now,
      config: state.config,
      state: %{
        mode: state.mode,
        time_left: state.time_left,
        is_running: state.is_running,
        cycles_completed: state.cycles_completed,
        has_pending_work_half_cycle: state.has_pending_work_half_cycle,
        settings: %{
          workDuration: state.config.work_duration,
          shortBreakDuration: state.config.short_break_duration,
          longBreakDuration: state.config.long_break_duration,
          cyclesBeforeLongBreak: state.config.cycles_before_long_break
        },
        modeSnapshots: %{
          work: mode_duration(state.config, "work"),
          shortBreak: mode_duration(state.config, "shortBreak"),
          longBreak: mode_duration(state.config, "longBreak")
        },
        last_completed_mode: state.last_completed_mode,
        last_updated: state.last_updated,
        started_at: state.started_at,
        paused_at: state.paused_at,
        duration_ms: duration_ms
      }
    }
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

  defp extract_config_version(timer_data) do
    value = Map.get(timer_data, :config_version)

    case value do
      version when is_integer(version) and version >= 0 -> version
      _ -> 0
    end
  end

  defp normalize_config_version(value) when is_integer(value) and value >= 0, do: {:ok, value}

  defp normalize_config_version(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} when parsed >= 0 -> {:ok, parsed}
      _ -> {:error, :invalid_config_version}
    end
  end

  defp normalize_config_version(_), do: {:error, :invalid_config_version}

  defp timer_topic(chat_id) do
    "chat:#{chat_id}:pomodoro"
  end
end
