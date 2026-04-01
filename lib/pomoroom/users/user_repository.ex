defmodule Pomoroom.Users.UserRepository do
	def insert(changes) do
		Mongo.insert_one(:mongo, "users", changes)
	end

	def delete_all() do
		Mongo.delete_many(:mongo, "users", %{})
	end

	def find_one_by(field, value) do
		query = %{field => value}
		Mongo.find_one(:mongo, "users", query)
	end

	def exists_by_nickname?(nickname) do
		case find_one_by("nickname", nickname) do
			nil -> false
			_ -> true
		end
	end

	def list_private_chats_for_user(nickname) do
		query = %{"members" => %{"$elemMatch" => %{"user_id" => nickname}}}
		Mongo.find(:mongo, "private_chats", query) |> Enum.to_list()
	end
end
