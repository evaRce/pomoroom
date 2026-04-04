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
        if user in group_chat.admin do
          now = DateTime.utc_now()
          members = group_chat.members || []

          existing_member =
            Enum.find(members, fn member ->
              get_member_id(member) == new_member
            end)

          case existing_member do
            nil ->
              GroupChatRepository.update_by_chat_id(
                group_chat.chat_id,
                "$addToSet",
                %{members: %{"user_id" => new_member, "joined_at" => now, "removed_at" => nil}}
              )

              {:ok, "Usuario #{new_member} añadido al grupo"}

            member when is_map(member) ->
              removed_at = get_member_removed_at(member)

              if is_nil(removed_at) do
                {:error, "El usuario #{new_member} ya es miembro del grupo"}
              else
                updated_members =
                  Enum.map(members, fn current_member ->
                    if get_member_id(current_member) == new_member do
                      current_member
                      |> Map.put("joined_at", now)
                      |> Map.put("removed_at", nil)
                    else
                      current_member
                    end
                  end)

                GroupChatRepository.update_members(group_chat.chat_id, updated_members)
                {:ok, "Usuario #{new_member} reañadido al grupo"}
              end
          end
        else
          {:error, "El usuario #{user} no tiene permiso para añadir miembros al grupo"}
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

          member_ids = get_member_ids(group_chat.members)

          if member in member_ids do
            remove_member_and_cleanup(group_chat, member, "Usuario #{member} eliminado del grupo")
          else
            {:error, "El usuario #{member} no es miembro del grupo"}
          end
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
        members = group_chat.members || []

        members_data =
          Enum.map(members, fn member_map ->
            member_id = get_member_id(member_map)
            joined_at = get_member_joined_at(member_map)
            removed_at = get_member_removed_at(member_map)

            if is_nil(removed_at) do
              case member_id && Users.get_by("nickname", member_id) do
                {:ok, user} ->
                  is_admin = member_id in group_chat.admin

                  user
                  |> Map.put(:is_admin, is_admin)
                  |> Map.put(:joined_at, joined_at)

                {:error, _reason} ->
                  nil
              end
            else
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

  def member_state(group_name, user) do
    case get_by("name", group_name) do
      {:error, _reason} ->
        :not_member

      {:ok, group_chat} ->
        members = group_chat.members || []

        member =
          Enum.find(members, fn member ->
            get_member_id(member) == user
          end)

        case member do
          nil ->
            :not_member

          found_member ->
            joined_at = get_member_joined_at(found_member)
            removed_at = get_member_removed_at(found_member)

            if is_nil(removed_at) do
              {:active, joined_at}
            else
              {:removed, joined_at, removed_at}
            end
        end
    end
  end

  def can_send_message?(group_name, user) do
    case member_state(group_name, user) do
      {:active, _joined_at} -> true
      _ -> false
    end
  end

  def add_admin(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        member_ids = get_member_ids(group_chat.members)

        if user in group_chat.admin do
          if member in member_ids do
            GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$addToSet", %{
              admin: member
            })

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
        member_ids = get_member_ids(group_chat.members)

        if user in group_chat.admin do
          if member in member_ids do
            if length(group_chat.admin) == 1 and user == member do
              new_admin = Enum.find(member_ids, fn m -> m != user end)

              if new_admin do
                GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$pull", %{
                  admin: member
                })

                GroupChatRepository.update_by_chat_id(group_chat.chat_id, "$push", %{
                  admin: new_admin
                })

                {:ok,
                 "Usuario #{member} eliminado como admin del grupo y #{new_admin} asignado como nuevo admin."}
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
    removed_at = DateTime.utc_now()

    updated_members =
      Enum.map(group_chat.members || [], fn current_member ->
        if get_member_id(current_member) == member do
          Map.put(current_member, "removed_at", removed_at)
        else
          current_member
        end
      end)

    GroupChatRepository.update_members(group_chat.chat_id, updated_members)

    {:ok, updated_chat} = get_by("chat_id", group_chat.chat_id)
    remaining_members =
      (updated_chat.members || [])
      |> Enum.filter(fn current_member ->
        is_nil(get_member_removed_at(current_member))
      end)

    if length(remaining_members) == 0 do
      Chats.delete_chat("group_chats", group_chat.chat_id)
      Messages.delete_all_belongs_to_chat(updated_chat.chat_id)
      {:ok, %{chat_deleted: true, chat_id: group_chat.chat_id}}
    else
      {:ok,
       %{
         message: success_message,
         chat_id: group_chat.chat_id,
         group_name: group_chat.name,
         removed_member: member,
         removed_at: removed_at
       }}
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

  defp get_member_ids(members) do
    Enum.map(members || [], fn member ->
      if is_nil(get_member_removed_at(member)) do
        get_member_id(member)
      else
        nil
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp get_member_id(member) when is_map(member),
    do: member["user_id"] || member[:user_id]

  defp get_member_id(member) when is_binary(member), do: member

  defp get_member_joined_at(member) when is_map(member),
    do: member["joined_at"] || member[:joined_at]

  defp get_member_joined_at(_member), do: nil

  defp get_member_removed_at(member) when is_map(member),
    do: member["removed_at"] || member[:removed_at]

  defp get_member_removed_at(_), do: nil

  defp get_default_group_image() do
    random_number = :rand.uniform(10)
    "/images/default_group/default_group-#{random_number}.svg"
  end
end
