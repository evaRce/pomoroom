defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository do
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema

  @collection "pomodoro_timers"

  def create(changes) do
    Mongo.insert_one(:mongo, @collection, changes)
  end

  def get_by_timer_id(timer_id) do
    case Mongo.find_one(:mongo, @collection, %{"timer_id" => timer_id}) do
      nil ->
        {:error, :not_found}

      timer when is_map(timer) ->
        {:ok, get_changes_from_doc(timer)}
    end
  end

  def upsert(changes) do
    set_data =
      changes
      |> Map.drop([:timer_id])

    Mongo.find_one_and_update(
      :mongo,
      @collection,
      %{"timer_id" => changes.timer_id},
      %{
        "$setOnInsert" => %{timer_id: changes.timer_id},
        "$set" => set_data
      },
      upsert: true,
      return_document: :after
    )
  end

  def update_config_if_version_matches(timer_id, config, expected_version) do
    next_version = expected_version + 1

    query =
      if expected_version == 0 do
        %{
          "$or" => [
            %{"timer_id" => timer_id, "config_version" => 0},
            %{"timer_id" => timer_id, "config_version" => %{"$exists" => false}}
          ]
        }
      else
        %{"timer_id" => timer_id, "config_version" => expected_version}
      end

    set_data = %{
      work_duration: config.work_duration,
      short_break_duration: config.short_break_duration,
      long_break_duration: config.long_break_duration,
      cycles_before_long_break: config.cycles_before_long_break,
      config_version: next_version
    }

    case Mongo.find_one_and_update(
           :mongo,
           @collection,
           query,
           %{"$set" => set_data},
           return_document: :after
         ) do
      {:ok, %Mongo.FindAndModifyResult{value: nil}} ->
        {:error, :version_conflict}

      {:ok, %Mongo.FindAndModifyResult{value: updated_timer}} when is_map(updated_timer) ->
        {:ok, get_changes_from_doc(updated_timer)}

      {:error, _reason} ->
        {:error, :failed_to_persist_config}
    end
  end

  def delete_by_timer_id(timer_id) do
    Mongo.delete_one(:mongo, @collection, %{"timer_id" => timer_id})
  end

  def delete_all() do
    Mongo.delete_many(:mongo, @collection, %{})
  end

  defp get_changes_from_doc(args) do
    changes = PomodoroTimerSchema.timer_changeset(args).changes

    Map.put_new(changes, :config_version, get_config_version(args))
  end

  defp get_config_version(args) do
    value = Map.get(args, :config_version) || Map.get(args, "config_version")

    case value do
      version when is_integer(version) and version >= 0 -> version
      _ -> 0
    end
  end
end
