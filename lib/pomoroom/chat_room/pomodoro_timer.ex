defmodule Pomoroom.ChatRoom.PomodoroTimer do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.Users

  schema "pomodoro_timers" do
    field :timer_id, :string
    field :work_seconds, :integer
    field :short_break_seconds, :integer
    field :long_break_seconds, :integer
    field :pomodoro_count, :integer
    field :current_time, :integer
    field :is_work_time, :boolean
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(attrs) do
    %Pomoroom.ChatRoom.PomodoroTimer{}
    |> cast(attrs, [
      :timer_id,
      :work_seconds,
      :short_break_seconds,
      :long_break_seconds,
      :pomodoro_count,
      :current_time,
      :is_work_time,
      :inserted_at,
      :updated_at
    ])
  end

  def timer_changeset(args) do
    changeset(args)
    |> validate_required([
      :timer_id,
      :work_seconds,
      :short_break_seconds,
      :long_break_seconds,
      :pomodoro_count,
      :current_time,
      :is_work_time,
      :inserted_at,
      :updated_at
    ])
  end

  def timer_changeset(user, work_time, short_break_time, long_break_time) do
    timer = %{
      timer_id: "#{user}_timer",
      work_seconds: work_time,
      short_break_seconds: short_break_time,
      long_break_seconds: long_break_time,
      pomodoro_count: 0,
      current_time: 0,
      is_work_time: true
    }

    changeset(timer)
    |> validate_required([
      :timer_id,
      :work_seconds,
      :short_break_seconds,
      :long_break_seconds,
      :pomodoro_count,
      :current_time,
      :is_work_time
    ])
  end

  def start(user, work_time, short_break_time, long_break_time) do
    case Users.exists_nickname?(user) do
      true ->
        timer_changst =
          user
          |> timer_changeset(work_time, short_break_time, long_break_time)
          |> timestamps()

        case Mongo.insert_one(:mongo, "pomodoro_timers", timer_changst.changes) do
          {:ok, _result} ->
            {:ok, timer_changst.changes}

          {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => _errmsg}]}} ->
            {:error, %{error: "#{user} ya tiene temporizador"}}
        end

      false ->
        {:error, %{error: "El usuario #{user} no existe"}}
    end
  end

  def update_config(user, work_time, short_break_time, long_break_time) do
    case Users.exists_nickname?(user) do
      true ->
        case update(user, work_time, short_break_time, long_break_time) do
          {:ok, %Mongo.FindAndModifyResult{value: updated_data}} ->
            # Filtrar campos no deseados
            updated_data = Map.drop(updated_data, ["_id", "timer_id"])
            IO.inspect(updated_data, label: "RESULT= ")
            {:ok, get_changes_from_changeset(updated_data)}

          _ ->
            {:error, %{error: "No se pudo actualizar el temporizador"}}
        end

      false ->
        {:error, %{error: "El usuario #{user} no existe"}}
    end
  end

  # def update_pomodoro() do
  # end

  defp timestamps(changeset) do
    change(changeset, %{inserted_at: NaiveDateTime.utc_now(), updated_at: NaiveDateTime.utc_now()})
  end

  defp get_changes_from_changeset(args) do
    timer_changeset(args).changes
  end

  defp update(user, work_time, short_break_time, long_break_time) do
    Mongo.find_one_and_update(
      :mongo,
      "pomodoro_timers",
      %{timer_id: "#{user}_timer"},
      %{
        "$set": %{
          work_seconds: work_time,
          short_break_seconds: short_break_time,
          long_break_seconds: long_break_time,
          updated_at: NaiveDateTime.utc_now()
        }
      },
      return_document: :after
    )
  end
end
