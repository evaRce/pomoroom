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

  def get_chat_messages(chat_id, limit \\ :all, joined_at \\ nil) do
    normalized_joined_at = normalize_joined_at(joined_at)

    msg_query =
      case normalized_joined_at do
        nil ->
          %{"chat_id" => chat_id}

        _ ->
          %{"chat_id" => chat_id, "inserted_at" => %{"$gte" => normalized_joined_at}}
      end

    sort_order = %{"inserted_at" => -1, "msg_id" => -1}

    find_messages =
      case limit do
        :all ->
          Mongo.find(:mongo, "messages", msg_query, sort: sort_order)

        limit when is_integer(limit) ->
          Mongo.find(:mongo, "messages", msg_query, sort: sort_order, limit: limit)
      end

    messages =
      Enum.map(find_messages, fn message ->
        db_id = message["_id"] |> to_string()

        message
        |> Map.delete("_id")
        |> get_changes_from_changeset()
        |> Map.put(:db_id, db_id)
      end)

    {:ok, Enum.reverse(messages)}
  end

  def get_chat_messages_before(
        chat_id,
        before_inserted_at,
        limit,
        before_db_id \\ nil,
        joined_at \\ nil
      ) do
    normalized_joined_at = normalize_joined_at(joined_at)

    base_query = %{"chat_id" => chat_id}

    new_base_query =
      case normalized_joined_at do
        nil -> base_query
        _ -> Map.put(base_query, "inserted_at", %{"$gte" => normalized_joined_at})
      end

    msg_query =
      case BSON.ObjectId.decode(before_db_id || "") do
        {:ok, object_id} ->
          or_conditions = [
            %{"inserted_at" => %{"$lt" => before_inserted_at}},
            %{"inserted_at" => before_inserted_at, "_id" => %{"$lt" => object_id}}
          ]

          case normalized_joined_at do
            nil ->
              Map.put(new_base_query, "$or", or_conditions)

            _ ->
              Map.put(new_base_query, "$or", [
                %{
                  "inserted_at" => %{"$gte" => normalized_joined_at, "$lt" => before_inserted_at}
                },
                %{
                  "inserted_at" => before_inserted_at,
                  "_id" => %{"$lt" => object_id}
                }
              ])
          end

        :error ->
          case normalized_joined_at do
            nil ->
              Map.put(new_base_query, "inserted_at", %{"$lt" => before_inserted_at})

            _ ->
              Map.put(new_base_query, "inserted_at", %{
                "$gte" => normalized_joined_at,
                "$lt" => before_inserted_at
              })
          end
      end

    sort_order = %{"inserted_at" => -1, "msg_id" => -1}

    messages =
      Mongo.find(:mongo, "messages", msg_query, sort: sort_order, limit: limit)
      |> Enum.map(fn message ->
        db_id = message["_id"] |> to_string()

        message
        |> Map.delete("_id")
        |> get_changes_from_changeset()
        |> Map.put(:db_id, db_id)
      end)
      |> Enum.reverse()

    {:ok, messages}
  end

  defp get_changes_from_changeset(args) do
    MessageSchema.message_changeset(args).changes
  end

  defp normalize_joined_at(%DateTime{} = datetime), do: DateTime.to_naive(datetime)
  defp normalize_joined_at(value), do: value
end
