defmodule Pomoroom.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :password, :string
    field :nickname, :string
    field :image_profile, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset_without_passw(args) do
    %Pomoroom.Users.User{}
    |> cast(args, [:email, :nickname, :image_profile, :inserted_at, :updated_at])
    |> validate_required([:email, :nickname, :image_profile, :inserted_at, :updated_at])
  end

  def changeset(args) do
    %Pomoroom.Users.User{}
    |> cast(args, [:email, :password, :nickname])
    |> validate_required([:email, :password, :nickname])
  end
end
