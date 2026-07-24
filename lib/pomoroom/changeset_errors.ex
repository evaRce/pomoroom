defmodule Pomoroom.ChangesetErrors do
  import Ecto.Changeset

  def to_map(changeset) do
    changeset
    |> traverse_errors(fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
    |> Map.new(fn {field, [message | _]} -> {field, message} end)
  end
end
