defmodule Pomoroom.PrivateChats.PrivateChatService do
  alias Pomoroom.Chats
  alias Pomoroom.FriendRequests
  alias Pomoroom.Messages
  alias Pomoroom.PrivateChats.{PrivateChatRepository, PrivateChatSchema}

  def create_private_chat(to_user, from_user) do
    private_chat_changeset =
      Chats.get_public_id_chat()
      |> PrivateChatSchema.private_chat_changeset([to_user, from_user])
      |> Chats.timestamps()

    case private_chat_changeset.valid? do
      true ->
        case PrivateChatRepository.create(private_chat_changeset.changes) do
          {:ok, _result} ->
            {:ok, private_chat_changeset.changes}

          {:error, _reason} ->
            {:error, %{error: "El contacto ya está añadido"}}
        end

      false ->
        {:error, %{error: "Hay un campo invalido"}}
    end
  end

  def delete_contact(chat_id, from_user) do
    case get(chat_id) do
      {:error, reason} ->
        {:error, reason}

      {:ok, chat} ->
        PrivateChatRepository.mark_deleted(chat_id, from_user)
        {:ok, updated_chat} = get(chat_id)
        members_list = Map.get(chat, :members) || []
        member_ids = Enum.map(members_list, fn member -> 
          Map.get(member, :user_id) || Map.get(member, "user_id")
        end)

        if both_users_deleted?(updated_chat.deleted_by, member_ids) do
          Chats.delete_chat("private_chats", chat_id)

          case member_ids do
            [user1, user2] -> FriendRequests.delete_request_between_users(user1, user2)
            _ -> :ok
          end

          Messages.delete_all_belongs_to_chat(chat_id)
        end

        {:ok, "Contacto eliminado"}
    end
  end

  def delete_all_private_chats() do
    PrivateChatRepository.delete_all()
  end

  def get(chat_id), do: PrivateChatRepository.get_by_chat_id(chat_id)

  def get(to_user, from_user), do: PrivateChatRepository.get_by_members(to_user, from_user)

  def ensure_exists(to_user, from_user) do
    case PrivateChatRepository.get_existing_chat(to_user, from_user) do
      nil ->
        create_private_chat(to_user, from_user)

      existing_chat ->
        {:ok, existing_chat}
    end
  end

  def update_restore_deleted_contact(chat, from_user) do
    PrivateChatRepository.restore_deleted(chat, from_user)
  end

  def get_member_joined_at(chat, member) when is_map(chat) and is_binary(member) do
    members = Map.get(chat, :members) || Map.get(chat, "members") || []
    
    member_data = Enum.find(members, fn m ->
      user_id = Map.get(m, :user_id) || Map.get(m, "user_id")
      user_id == member
    end)
    
    case member_data do
      nil -> nil
      data -> Map.get(data, :joined_at) || Map.get(data, "joined_at")
    end
  end

  def both_users_deleted?(deleted_by, members) do
    Enum.all?(members, fn member -> member in deleted_by end)
  end
end