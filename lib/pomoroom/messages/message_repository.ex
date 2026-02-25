defmodule Pomoroom.Messages.MessageRepository do
  alias Pomoroom.Messages.MessageSchema

  def create(changes) do
    Mongo.insert_one(:mongo, "messages", changes)
  end

  def delete(msg_id) do
    msg_query = %{"msg_id" => msg_id}

    Mongo.delete_one(:mongo, "messages", msg_query)
    :ok
  end

  def delete_all_belongs_to_chat(chat_id) do
    msg_query = %{"chat_id" => chat_id}

    Mongo.delete_many(:mongo, "messages", msg_query)
    :ok
  end

  def delete_all() do
    Mongo.delete_many(:mongo, "messages", %{})
  end

  def get_by_id(""), do: {:error, :not_found}

  def get_by_id(msg_id) do
    msg_query = %{"msg_id" => msg_id}

    case Mongo.find_one(:mongo, "messages", msg_query) do
      nil ->
        {:error, :not_found}

      message_data when is_map(message_data) ->
        {:ok, get_changes_from_changeset(message_data)}
    end
  end

  def get_chat_messages(chat_id, limit \\ :all) do
    msg_query = %{"chat_id" => chat_id}
    sort_order = %{"inserted_at" => -1}

    find_messages =
      case limit do
        :all ->
          Mongo.find(:mongo, "messages", msg_query, sort: sort_order)

        limit when is_integer(limit) ->
          Mongo.find(:mongo, "messages", msg_query, sort: sort_order, limit: limit)
      end

    messages =
      Enum.map(find_messages, fn message ->
        Map.delete(message, "_id")
        |> get_changes_from_changeset()
      end)

    {:ok, Enum.reverse(messages)}
  end

  defp get_changes_from_changeset(args) do
    MessageSchema.message_changeset(args).changes
  end
end
