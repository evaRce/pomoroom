defmodule Pomoroom.Startup do
  def create_indexes do
    IO.puts("Using database #{Application.get_env(:pomoroom, :db)[:database]}")

    user_indexes = [
      [key: %{email: 1}, name: "email_index", unique: true],
      [key: %{nickname: 1}, name: "nickname_index", unique: true]
    ]

    message_indexes = [
      [key: %{msg_id: 1}, name: "msg_id_index", unique: true]
    ]

    private_chats_indexes = [
      [key: %{chat_id: 1}, name: "private_chat_id_index", unique: true],
      [
        key: %{"sorted_members.0" => 1, "sorted_members.1" => 1},
        name: "private_chat_members_index",
        unique: true
      ]
    ]

    group_chats_indexes = [
      [key: %{chat_id: 1}, name: "group_chat_id_index", unique: true],
      [key: %{name: 1}, name: "group_chat_name_index", unique: true]
    ]

    friend_requests_indexes = [
      [key: %{from_user: 1, to_user: 1}, name: "request_index", unique: true]
    ]

    chat_plugins_indexes = [
      [key: %{chat_id: 1, plugin_id: 1, type: 1}, name: "chat_plugin_unique_index", unique: true],
    ]

    Mongo.create_indexes(:mongo, "users", user_indexes)
    Mongo.create_indexes(:mongo, "messages", message_indexes)
    Mongo.create_indexes(:mongo, "private_chats", private_chats_indexes)
    Mongo.create_indexes(:mongo, "group_chats", group_chats_indexes)
    Mongo.create_indexes(:mongo, "friend_requests", friend_requests_indexes)
    Mongo.create_indexes(:mongo, "chat_plugins", chat_plugins_indexes)
  end
end
