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
        {:ok, get_changes_from_changeset(timer)}
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

  def delete_by_timer_id(timer_id) do
    Mongo.delete_one(:mongo, @collection, %{"timer_id" => timer_id})
  end

  def delete_all() do
    Mongo.delete_many(:mongo, @collection, %{})
  end

  defp get_changes_from_changeset(args) do
    PomodoroTimerSchema.timer_changeset(args).changes
  end
end
