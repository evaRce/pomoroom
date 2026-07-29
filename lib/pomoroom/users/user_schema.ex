defmodule Pomoroom.Users.UserSchema do
  use Ecto.Schema
  import Ecto.Changeset

  @nickname_regex ~r/^\w[\w.]{2,18}\w$/
  @email_regex ~r/^[^\s@]+@[^\s@]+\.[^\s@]+$/

  schema "users" do
    field :email, :string
    field :password, :string
    field :nickname, :string
    field :image_profile, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset_without_passw(args) do
    %Pomoroom.Users.UserSchema{}
    |> cast(args, [:email, :nickname, :image_profile, :inserted_at, :updated_at])
    |> validate_required([:email, :nickname, :image_profile, :inserted_at, :updated_at])
  end

  def changeset(args) do
    %Pomoroom.Users.UserSchema{}
    |> cast(args, [:email, :password, :nickname])
    |> validate_required([:email, :password, :nickname])
    |> validate_format(:email, @email_regex, message: "no es un email válido")
    |> validate_length(:password, min: 8, max: 64)
    |> validate_length(:nickname, min: 4, max: 20)
    |> validate_format(:nickname, @nickname_regex, message: "no es un apodo válido")
  end
end
