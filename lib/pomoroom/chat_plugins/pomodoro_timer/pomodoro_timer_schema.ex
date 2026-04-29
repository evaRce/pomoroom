defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pomodoro_timers" do
    field :timer_id, :string
    field :chat_id, :string
    field :chat_type, :string
    field :plugin_id, :string
    field :work_duration, :integer
    field :short_break_duration, :integer
    field :long_break_duration, :integer
    field :cycles_before_long_break, :integer
    field :updated_by, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema{}
    |> cast(args, [
      :timer_id,
      :chat_id,
      :chat_type,
      :plugin_id,
      :work_duration,
      :short_break_duration,
      :long_break_duration,
      :cycles_before_long_break,
      :updated_by,
      :inserted_at,
      :updated_at
    ])
  end

  def timer_changeset(args) do
    changeset(args)
    |> validate_required([
      :timer_id,
      :chat_id,
      :chat_type,
      :plugin_id,
      :work_duration,
      :short_break_duration,
      :long_break_duration,
      :cycles_before_long_break,
      :updated_by,
      :inserted_at,
      :updated_at
    ])
    |> validate_number(:work_duration, greater_than: 0)
    |> validate_number(:short_break_duration, greater_than: 0)
    |> validate_number(:long_break_duration, greater_than: 0)
    |> validate_number(:cycles_before_long_break, greater_than: 0)
  end
end
