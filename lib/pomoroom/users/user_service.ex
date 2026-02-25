defmodule Pomoroom.Users.UserService do
  alias Pomoroom.ChatRoom.Chat
  alias Pomoroom.Users.{UserSchema, UserRepository}
  import Ecto.Changeset

  def register_user(args) do
    user_changeset =
      args
      |> UserSchema.changeset()
      |> set_hash_password()
      |> set_timestamps()
      |> set_default_image()

    case user_changeset.valid? do
      true ->
        insert_user = UserRepository.insert(user_changeset.changes)

        case insert_user do
          {:ok, _result} ->
            {:ok, user_changeset.changes}

          {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => errmsg}]}} ->
            {:error, parse_duplicate_key_error(errmsg)}
        end

      false ->
        {:error, %{error: "Falta un campo"}}
    end
  end

  def delete_all_users() do
    UserRepository.delete_all()
  end

  def get_with_passw(field, value) do
    case UserRepository.find_one_by(field, value) do
      nil ->
        {:error, :not_found}

      user_data when is_map(user_data) ->
        {:ok, UserSchema.changeset(user_data).changes}
    end
  end

  def get_by(field, value) do
    case UserRepository.find_one_by(field, value) do
      nil ->
        {:error, :not_found}

      user_data when is_map(user_data) ->
        user =
          user_data
          |> Map.drop(["_id", "password"])
          |> UserSchema.changeset_without_passw()

        {:ok, user.changes}
    end
  end

  def get_contacts(nickname) do
    case UserRepository.list_private_chats_for_user(nickname) do
      [] ->
        {:ok, []}

      chat_list ->
        contacts =
          Enum.flat_map(chat_list, fn chat ->
            chat["members"]
            |> Enum.filter(fn contact ->
              contact != nickname and not Enum.member?(chat["deleted_by"], nickname)
            end)
            |> Enum.map(fn contact ->
              case get_by("nickname", contact) do
                {:ok, user_info} -> user_info
                {:error, _} -> nil
              end
            end)
          end)
          |> Enum.reject(&is_nil/1)

        {:ok, contacts}
    end
  end

  def get_all_contacts(nickname) do
    {:ok, group_chat_data} = Chat.get_all_group_chats_data(nickname)
    {:ok, private_contacts_data} = get_contacts(nickname)

    case group_chat_data ++ private_contacts_data do
      [] -> {:ok, []}
      list -> {:ok, list}
    end
  end

  def get_all_my_chats_id(nickname) do
    Chat.get_all_chats_id(nickname)
  end

  def exists_nickname?(nickname) do
    UserRepository.exists_by_nickname?(nickname)
  end

  defp parse_duplicate_key_error(errmsg) do
    cond do
      String.contains?(errmsg, "email") ->
        %{email: "Este email ya está siendo usado"}

      String.contains?(errmsg, "nickname") ->
        %{nickname: "Este nickname ya está asociado a otra cuenta"}
    end
  end

  defp set_hash_password(changeset) do
    hashed_password =
      changeset
      |> fetch_field(:password)
      |> elem(1)
      |> Bcrypt.hash_pwd_salt()

    change(changeset, %{password: hashed_password})
  end

  defp set_timestamps(changeset) do
    now = NaiveDateTime.utc_now()
    change(changeset, %{inserted_at: now, updated_at: now})
  end

  defp set_default_image(changeset) do
    random_number = :rand.uniform(10)
    image = "/images/default_user/default_user-#{random_number}.svg"
    change(changeset, %{image_profile: image})
  end
end
