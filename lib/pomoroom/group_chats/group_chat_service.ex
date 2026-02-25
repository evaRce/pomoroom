defmodule Pomoroom.GroupChats.GroupChatService do
  alias Pomoroom.Chats
  alias Pomoroom.GroupChats.{GroupChatRepository, GroupChatSchema}
  alias Pomoroom.Messages
  alias Pomoroom.Users

  def create_group_chat(from_user, name) do
    chat_id = Chats.get_public_id_chat()

    group_changeset =
      chat_id
      |> GroupChatSchema.group_chat_changeset(
        name,
        get_default_group_image(),
        from_user,
        generate_invite_link(chat_id)
      )
      |> Chats.timestamps()

    case group_changeset.valid? do
      true ->
        case GroupChatRepository.create(group_changeset.changes) do
          {:ok, _result} ->
            {:ok, group_changeset.changes}

          {:error, %Mongo.WriteError{write_errors: [%{"code" => 11000, "errmsg" => _errmsg}]}} ->
            {:error, %{error: "El grupo `#{name}` ya está creado"}}
        end

      false ->
        {:error, %{error: "Hay un campo invalido"}}
    end
  end

  def add_member(group_name, user, new_member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if new_member in group_chat.members do
          {:error, "El usuario #{new_member} ya es miembro del grupo"}
        else
          if user in group_chat.admin do
            GroupChatRepository.update_by_chat_id(
              group_chat.chat_id,
              "$addToSet",
              %{members: new_member}
            )
            {:ok, "Usuario #{new_member} añadido al grupo"}
          else
            {:error, "El usuario #{user} no tiene permiso para añadir miembros al grupo"}
          end
        end
    end
  end

  def join_group_with_link(invite_link, user) do
    case decode_chat_id_from_invite_link(invite_link) do
      {:ok, chat_id} ->
        # cambiar chat_id por chat_name
        add_member(chat_id, user, user)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete(group_name, user) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          delete_admin(group_name, user, user)
        end

        remove_member_and_cleanup(
          group_chat,
          user,
          "Contacto eliminado del grupo #{group_name}"
        )
    end
  end

  def delete_member(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          if member in group_chat.admin do
            delete_admin(group_name, user, member)
          end

          remove_member_and_cleanup(group_chat, member, "Usuario #{member} eliminado del grupo")
        else
          {:error, "El usuario #{user} no tiene permiso para eliminar miembros del grupo"}
        end
    end
  end

  def delete_all_group_chats() do
    GroupChatRepository.delete_all()
  end

  def get_by(field, value), do: GroupChatRepository.get_by(field, value)

  def get_members(group_name) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        members_data =
          Enum.map(group_chat.members, fn member ->
            case Users.get_by("nickname", member) do
              {:ok, user} ->
                is_admin = member in group_chat.admin
                Map.put(user, :is_admin, is_admin)

              {:error, _reason} ->
                nil
            end
          end)
          |> Enum.reject(&is_nil/1)

        {:ok, members_data}
    end
  end

  def is_admin?(group_name, user) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        user in group_chat.admin
    end
  end

  def add_admin(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          if member in group_chat.members do
            GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$addToSet", %{admin: member})
            {:ok, "Usuario #{member} añadido como admin al grupo"}
          else
            {:error, "El usuario #{member} no es miembro del grupo"}
          end
        else
          {:error, "El usuario #{user} no tiene permiso para añadir admins al grupo"}
        end
    end
  end

  def delete_admin(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          if member in group_chat.members do
            if length(group_chat.admin) == 1 and user == member do
              new_admin = Enum.find(group_chat.members, fn m -> m != user end)

              if new_admin do
                GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$pull", %{admin: member})
                GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$push", %{admin: new_admin})

                {:ok, "Usuario #{member} eliminado como admin del grupo y #{new_admin} asignado como nuevo admin."}
              else
                {:error, "No hay otros miembros disponibles para ser administradores."}
              end
            else
              GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$pull", %{admin: member})
              {:ok, "Usuario #{member} eliminado como admin del grupo"}
            end
          else
            {:error, "El usuario #{member} no es miembro del grupo"}
          end
        else
          {:error, "El usuario #{user} no tiene permiso para eliminar admins del grupo"}
        end
    end
  end

  defp remove_member_and_cleanup(group_chat, member, success_message) do
    GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$pull", %{members: member})
    {:ok, updated_chat} = get_by("chat_id", group_chat.chat_id)

    if length(updated_chat.members) == 0 do
      Chats.delete_chat("group_chats", group_chat.chat_id)
      Messages.delete_all_belongs_to_chat(updated_chat.chat_id)
      {:ok, "Grupo eliminado, ya que el último usuario fue eliminado"}
    else
      {:ok, success_message}
    end
  end

  defp generate_invite_link(chat_id) do
    encoded_chat_id = Base.url_encode64(chat_id, padding: false)
    "https://pomoroom/chat/#{encoded_chat_id}"
  end

  defp decode_chat_id_from_invite_link(invite_link) do
    [_base_url, _chat, encoded_chat_id] = String.split(invite_link, "/")

    case Base.url_decode64(encoded_chat_id, padding: false) do
      {:ok, chat_id} ->
        case Chats.exists?(chat_id) do
          true ->
            {:ok, chat_id}

          false ->
            {:error, %{error: "El chat del enlace `#{invite_link}` no existe"}}
        end

      :error ->
        {:error, %{error: "Enlace de invitación inválido"}}
    end
  end

  defp get_default_group_image() do
    random_number = :rand.uniform(10)
    "/images/default_group/default_group-#{random_number}.svg"
  end
end
