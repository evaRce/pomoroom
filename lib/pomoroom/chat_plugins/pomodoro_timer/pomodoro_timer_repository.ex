defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerRepository do
  alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema

  @collection "pomodoro_timers"

  def get_by_timer_id(timer_id) do
    case Mongo.find_one(:mongo, @collection, %{"timer_id" => timer_id}) do
      nil ->
        {:error, :not_found}

      timer when is_map(timer) ->
        {:ok, get_changes_from_changeset(timer)}
    end
  end

  def upsert(changes) do
    now = DateTime.utc_now()

    set_on_insert =
      changes
      |> Map.take([:timer_id, :chat_id, :chat_type, :plugin_id])
      |> Map.put(:inserted_at, now)

    set_data =
      changes
      |> Map.drop([:timer_id, :chat_id, :chat_type, :plugin_id, :inserted_at])
      |> Map.put(:updated_at, now)

    Mongo.find_one_and_update(
      :mongo,
      @collection,
      %{
        "chat_id" => changes.chat_id,
        "chat_type" => changes.chat_type,
        "plugin_id" => changes.plugin_id
      },
      %{
        "$setOnInsert" => set_on_insert,
        "$set" => set_data
      },
      upsert: true,
      return_document: :after
    )
  end

  def delete_by_timer_id(timer_id) do
    Mongo.delete_one(:mongo, @collection, %{"timer_id" => timer_id})
  end

  def delete_by_chat(chat_id, chat_type, plugin_id) do
    Mongo.delete_one(:mongo, @collection, %{
      "chat_id" => chat_id,
      "chat_type" => chat_type,
      "plugin_id" => plugin_id
    })
  end

  def delete_all() do
    Mongo.delete_many(:mongo, @collection, %{})
  end

  def get_by_chat(chat_id, chat_type, plugin_id) do
    case Mongo.find_one(:mongo, @collection, %{
           "chat_id" => chat_id,
           "chat_type" => chat_type,
           "plugin_id" => plugin_id
         }) do
      nil -> {:error, :not_found}
      timer when is_map(timer) -> {:ok, get_changes_from_changeset(timer)}
    end
  end

  defp get_changes_from_changeset(args) do
    PomodoroTimerSchema.timer_changeset(args).changes
  end
end
