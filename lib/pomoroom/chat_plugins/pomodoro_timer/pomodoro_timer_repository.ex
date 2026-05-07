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
    set_on_insert =
      changes
      |> Map.take([:timer_id, :chat_id, :chat_type])

    set_data =
      changes
      |> Map.drop([:timer_id, :chat_id, :chat_type])

    Mongo.find_one_and_update(
      :mongo,
      @collection,
      %{
        "chat_id" => changes.chat_id,
        "chat_type" => changes.chat_type
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

  def delete_by_chat(chat_id, chat_type) do
    Mongo.delete_one(:mongo, @collection, %{
      "chat_id" => chat_id,
      "chat_type" => chat_type
    })
  end

  def delete_all() do
    Mongo.delete_many(:mongo, @collection, %{})
  end

  def get_by_chat(chat_id, chat_type) do
    case Mongo.find_one(:mongo, @collection, %{
           "chat_id" => chat_id,
           "chat_type" => chat_type
         }) do
      nil -> {:error, :not_found}
      timer when is_map(timer) -> {:ok, get_changes_from_changeset(timer)}
    end
  end

  defp get_changes_from_changeset(args) do
    PomodoroTimerSchema.timer_changeset(args).changes
  end
end
