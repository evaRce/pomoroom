defmodule Pomoroom.FriendRequests.FriendRequestSchema do
  use Ecto.Schema
  import Ecto.Changeset

  schema "friend_requests" do
    field :status, :string
    field :from_user, :string
    field :to_user, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.FriendRequests.FriendRequestSchema{}
    |> cast(args, [:status, :from_user, :to_user, :inserted_at, :updated_at])
  end

  def request_changeset(args) do
    changeset(args)
    |> validate_required([:status, :from_user, :to_user, :inserted_at, :updated_at])
  end

  def request_changeset(to_user, from_user) do
    request = %{status: "pending", from_user: from_user, to_user: to_user}

    request
    |> changeset()
    |> validate_required([:status, :from_user, :to_user])
  end
end
