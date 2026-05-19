defmodule Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "pomodoro_timers" do
    field :timer_id, :string
    field :work_duration, :integer
    field :short_break_duration, :integer
    field :long_break_duration, :integer
    field :cycles_before_long_break, :integer
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerSchema{}
    |> cast(args, [
      :timer_id,
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
      :work_duration,
      :short_break_duration,
      :long_break_duration,
      :cycles_before_long_break
    ])
  end

  def generate_timer_id() do
    Ecto.UUID.generate()
  end
end
