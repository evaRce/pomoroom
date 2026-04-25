defmodule Pomoroom.ChatPlugins.ChatPluginSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "chat_plugins" do
    field :chat_id, :string
    field :chat_type, :string
    field :plugin_id, :string
    field :installed_by, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatPlugins.ChatPluginSchema{}
    |> cast(args, [:chat_id, :chat_type, :plugin_id, :installed_by, :inserted_at, :updated_at])
  end

  def chat_plugin_changeset(args) do
    changeset(args)
    |> validate_required([
      :chat_id,
      :chat_type,
      :plugin_id,
      :installed_by,
      :inserted_at,
      :updated_at
    ])
  end

  def chat_plugin_changeset(chat_id, chat_type, plugin_id, installed_by) do
    now = DateTime.utc_now()

    %{
      chat_id: chat_id,
      chat_type: chat_type,
      plugin_id: plugin_id,
      installed_by: installed_by,
      inserted_at: now,
      updated_at: now
    }
    |> changeset()
    |> validate_required([
      :chat_id,
      :chat_type,
      :plugin_id,
      :installed_by,
      :inserted_at,
      :updated_at
    ])
  end
end
