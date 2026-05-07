defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pomodoro_timers" do
    field :timer_id, :string
    field :chat_id, :string
    field :chat_type, :string
    field :work_duration, :integer
    field :short_break_duration, :integer
    field :long_break_duration, :integer
    field :cycles_before_long_break, :integer
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema{}
    |> cast(args, [
      :timer_id,
      :chat_id,
      :chat_type,
      :work_duration,
      :short_break_duration,
      :long_break_duration,
      :cycles_before_long_break
    ])
  end

  def timer_changeset(args) do
    changeset(args)
    |> validate_required([
      :timer_id,
      :chat_id,
      :chat_type,
      :work_duration,
      :short_break_duration,
      :long_break_duration,
      :cycles_before_long_break
    ])
    |> validate_number(:work_duration, greater_than: 0)
    |> validate_number(:short_break_duration, greater_than: 0)
    |> validate_number(:long_break_duration, greater_than: 0)
    |> validate_number(:cycles_before_long_break, greater_than: 0)
  end
end
