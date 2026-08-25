defmodule Pomoroom.Users.UserSchemaTest do
  use Pomoroom.DataCase, async: true
  alias Pomoroom.Users.UserSchema

  @valid_attrs %{
    email: "email_1@h.es",
    nickname: "nickname_1",
    password: "password_1",
    password_confirmation: "password_1"
  }

  test "is valid with correct attrs" do
    changeset = UserSchema.changeset(@valid_attrs)

    assert changeset.valid?
  end

  test "is invalid when email, nickname or password are missing" do
    changeset = UserSchema.changeset(%{})

    refute changeset.valid?
    assert %{email: ["can't be blank"]} = errors_on(changeset)
    assert %{nickname: ["can't be blank"]} = errors_on(changeset)
    assert %{password: ["can't be blank"]} = errors_on(changeset)
  end

  test "is invalid with a malformed email" do
    changeset = UserSchema.changeset(%{@valid_attrs | email: "not-an-email"})

    refute changeset.valid?
    assert %{email: [_message]} = errors_on(changeset)
  end

  test "is invalid when password is shorter than 8 characters" do
    changeset =
      UserSchema.changeset(%{
        @valid_attrs
        | password: "short",
          password_confirmation: "short"
      })

    refute changeset.valid?
    assert %{password: [_message]} = errors_on(changeset)
  end

  test "is invalid when password confirmation does not match" do
    changeset = UserSchema.changeset(%{@valid_attrs | password_confirmation: "other_password"})

    refute changeset.valid?
    assert %{password_confirmation: [_message]} = errors_on(changeset)
  end

  test "is invalid when nickname is too short" do
    changeset = UserSchema.changeset(%{@valid_attrs | nickname: "ab"})

    refute changeset.valid?
    assert "should be at least 4 character(s)" in errors_on(changeset).nickname
  end

  test "is invalid when nickname has an invalid format" do
    changeset = UserSchema.changeset(%{@valid_attrs | nickname: "no spaces allowed"})

    refute changeset.valid?
    assert %{nickname: [_message]} = errors_on(changeset)
  end

  test "is invalid when password is longer than 64 characters" do
    long_password = String.duplicate("a", 65)

    changeset =
      UserSchema.changeset(%{
        @valid_attrs
        | password: long_password,
          password_confirmation: long_password
      })

    refute changeset.valid?
    assert "should be at most 64 character(s)" in errors_on(changeset).password
  end

  test "is invalid when nickname is longer than 20 characters" do
    changeset = UserSchema.changeset(%{@valid_attrs | nickname: String.duplicate("a", 21)})

    refute changeset.valid?
    assert "should be at most 20 character(s)" in errors_on(changeset).nickname
  end

  test "is invalid when password confirmation is missing" do
    changeset = UserSchema.changeset(Map.delete(@valid_attrs, :password_confirmation))

    refute changeset.valid?
    assert %{password_confirmation: [_message]} = errors_on(changeset)
  end

  test "is valid at the exact minimum length boundaries" do
    changeset =
      UserSchema.changeset(%{
        @valid_attrs
        | nickname: "abcd",
          password: "12345678",
          password_confirmation: "12345678"
      })

    assert changeset.valid?
  end
end
