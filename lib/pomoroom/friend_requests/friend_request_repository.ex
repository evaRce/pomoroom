defmodule Pomoroom.FriendRequests.FriendRequestRepository do
  alias Pomoroom.FriendRequests.FriendRequestSchema

  def create(changes) do
    Mongo.insert_one(:mongo, "friend_requests", changes)
  end

  def get(to_user, from_user) do
    request_query = %{"to_user" => to_user, "from_user" => from_user}

    case Mongo.find_one(:mongo, "friend_requests", request_query) do
      nil ->
        {:error, :not_found}

      request_data when is_map(request_data) ->
        {:ok, FriendRequestSchema.request_changeset(request_data).changes}
    end
  end

  def update_request_status(to_user, from_user, status) do
    Mongo.update_one(
      :mongo,
      "friend_requests",
      %{from_user: from_user, to_user: to_user, status: "pending"},
      %{"$set": %{status: status, updated_at: NaiveDateTime.utc_now()}}
    )
  end

  def delete(to_user, from_user) do
    request_query = %{"to_user" => to_user, "from_user" => from_user}
    Mongo.delete_one(:mongo, "friend_requests", request_query)
    :ok
  end

  def delete_all() do
    Mongo.delete_many(:mongo, "friend_requests", %{})
  end
end
