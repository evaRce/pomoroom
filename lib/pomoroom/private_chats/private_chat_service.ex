defmodule Pomoroom.PrivateChats.PrivateChatService do
  alias Pomoroom.ChatRoom.Chat
  alias Pomoroom.FriendRequests
  alias Pomoroom.Messages
  alias Pomoroom.PrivateChats.{PrivateChatRepository, PrivateChatSchema}

  def create_private_chat(to_user, from_user) do
    private_chat_changeset =
      Chat.get_public_id_chat()
      |> PrivateChatSchema.private_chat_changeset([to_user, from_user])
      |> Chat.timestamps()

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
        [member1, member2] = Map.get(chat, :members)

        if both_users_deleted?(updated_chat.deleted_by, [member1, member2]) do
          Chat.delete_chat("private_chats", chat_id)
          FriendRequests.delete_request(member1, member2)
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
        existing_chat
    end
  end

  def update_restore_deleted_contact(chat, from_user) do
    PrivateChatRepository.restore_deleted(chat, from_user)
  end

  def both_users_deleted?(deleted_by, members) do
    Enum.all?(members, fn member -> member in deleted_by end)
  end
end