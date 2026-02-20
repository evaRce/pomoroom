defmodule Pomoroom.ChatRoom.GroupChat do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pomoroom.ChatRoom.{Chat, Message}
  alias Pomoroom.Users

  schema "group_chats" do
    field :chat_id, :string
    field :name, :string
    field :image, :string
    field :admin, {:array, :string}
    field :members, {:array, :string}
    field :invite_link, :string
    field :inserted_at, :utc_datetime
    field :updated_at, :utc_datetime
  end

  def changeset(args) do
    %Pomoroom.ChatRoom.GroupChat{}
    |> cast(args, [
      :chat_id,
      :name,
      :image,
      :admin,
      :members,
      :invite_link,
      :inserted_at,
      :updated_at
    ])
  end

  def group_chat_changeset(args) do
    changeset(args)
    |> validate_required([
      :chat_id,
      :name,
      :image,
      :admin,
      :members,
      :invite_link,
      :inserted_at,
      :updated_at
    ])
  end

  def group_chat_changeset(chat_id, name, image, from_user, invite_link) do
    group_chat = %{
      chat_id: chat_id,
      name: name,
      image: image,
      admin: [from_user],
      members: [from_user],
      invite_link: invite_link
    }

    changeset(group_chat)
    |> validate_required([:chat_id, :name, :image, :admin, :members, :invite_link])
  end

  def create_group_chat(from_user, name) do
    chat_id = Chat.get_public_id_chat()

    group_changst =
      chat_id
      |> group_chat_changeset(
        name,
        get_default_group_image(),
        from_user,
        generate_invite_link(chat_id)
      )
      |> Chat.timestamps()

    case group_changst.valid? do
      true ->
        case Mongo.insert_one(:mongo, "group_chats", group_changst.changes) do
          {:ok, _result} ->
            {:ok, group_changst.changes}

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
            query = %{"chat_id" => group_chat.chat_id}
            # añade un user sin duplicados
            update(query, "$addToSet", %{members: new_member})
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
        query = %{"chat_id" => group_chat.chat_id}
        # eliminar el user de members
        if is_admin?(group_name, user) do
          delete_admin(group_name, user, user)
        end

        update(query, "$pull", %{members: user})
        {:ok, updated_chat} = get_by("chat_id", group_chat.chat_id)

        if length(updated_chat.members) == 0 do
          Chat.delete_chat("group_chats", group_chat.chat_id)
          Message.delete_all_belongs_to_chat(updated_chat.chat_id)
          {:ok, "Grupo eliminado, ya que el último usuario fue eliminado"}
        else
          {:ok, "Contacto eliminado del grupo #{group_name}"}
        end
    end
  end

  def delete_member(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          query = %{"chat_id" => group_chat.chat_id}
          # eliminar el user de members
          update(query, "$pull", %{members: member})
          {:ok, updated_chat} = get_by("chat_id", group_chat.chat_id)

          if length(updated_chat.members) == 0 do
            Chat.delete_chat("group_chats", group_chat.chat_id)
            Message.delete_all_belongs_to_chat(updated_chat.chat_id)
            {:ok, "Grupo eliminado, ya que el último usuario fue eliminado"}
          else
            {:ok, "Usuario #{member} eliminado del grupo"}
          end
        else
          {:error, "El usuario #{user} no tiene permiso para eliminar miembros del grupo"}
        end
    end
  end

  def delete_all_group_chats() do
    Mongo.delete_many(:mongo, "group_chats", %{})
  end

  def get_by(field, value) do
    query = %{field => value}

    case Mongo.find_one(:mongo, "group_chats", query) do
      nil ->
        {:error, "Chat no encontrado"}

      chat ->
        {:ok, get_changes_from_changeset(chat)}
    end
  end

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
        if user in group_chat.admin do
          true
        else
          false
        end
    end
  end

  def add_admin(group_name, user, member) do
    case get_by("name", group_name) do
      {:error, reason} ->
        {:error, reason}

      {:ok, group_chat} ->
        if user in group_chat.admin do
          if member in group_chat.members do
            query = %{"chat_id" => group_chat.chat_id}
            # añade el member a la lista de admin
            update(query, "$addToSet", %{admin: member})
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
                query = %{"chat_id" => group_chat.chat_id}
                update(query, "$pull", %{admin: member})
                update(query, "$push", %{admin: new_admin})

                {:ok,
                 "Usuario #{member} eliminado como admin del grupo y #{new_admin} asignado como nuevo admin."}
              else
                {:error, "No hay otros miembros disponibles para ser administradores."}
              end
            else
              query = %{"chat_id" => group_chat.chat_id}
              update(query, "$pull", %{admin: member})
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

  defp generate_invite_link(chat_id) do
    encoded_chat_id = Base.url_encode64(chat_id, padding: false)
    "https://pomoroom/chat/#{encoded_chat_id}"
  end

  defp decode_chat_id_from_invite_link(invite_link) do
    [_base_url, _chat, encoded_chat_id] = String.split(invite_link, "/")

    case Base.url_decode64(encoded_chat_id, padding: false) do
      {:ok, chat_id} ->
        case Chat.exists?(chat_id) do
          true ->
            {:ok, chat_id}

          false ->
            {:error, %{error: "El chat del enlace `#{invite_link}` no existe"}}
        end

      :error ->
        {:error, %{error: "Enlace de invitación inválido"}}
    end
  end

  defp update(filter, operator, operation) do
    Mongo.update_one(
      :mongo,
      "group_chats",
      filter,
      %{operator => operation, "$set" => %{updated_at: NaiveDateTime.utc_now()}}
    )
  end

  defp get_default_group_image() do
    random_number = :rand.uniform(10)
    "/images/default_group/default_group-#{random_number}.svg"
  end

  defp get_changes_from_changeset(args) do
    group_chat_changeset(args).changes
  end
end
