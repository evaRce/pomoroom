defmodule Pomoroom.ChatRoom.ChatServer do
  use GenServer
  alias Phoenix.PubSub
  alias Pomoroom.Messages

  def start_link(chat_id) do
    GenServer.start_link(__MODULE__, %{chat_id: chat_id, messages: [], first_load: true},
      name: via_tuple(chat_id)
    )
  end

  def send_message(chat_id, user, image_profile, message) do
    GenServer.call(via_tuple(chat_id), {:send_message, user, image_profile, message})
  end

  def get_messages(chat_id, limit \\ :all) do
    GenServer.call(via_tuple(chat_id), {:get_messages, limit})
  end

  def get_messages_before(chat_id, before_inserted_at, limit, before_db_id \\ nil) do
    GenServer.call(
      via_tuple(chat_id),
      {:get_messages_before, before_inserted_at, limit, before_db_id}
    )
  end

  def join_chat(chat_id) do
    GenServer.call(via_tuple(chat_id), :join_chat)
  end

  # Server Callbacks
  def init(state) do
    PubSub.subscribe(Pomoroom.PubSub, chat_topic(state.chat_id))
    {:ok, state}
  end

  def handle_call({:send_message, user, image_profile, message}, _from, state) do
    case Messages.new_message(message, user, state.chat_id) do
      {:ok, msg} ->
        msg_with_image = %{
          data: msg,
          image_user: image_profile
        }

        PubSub.broadcast(
          Pomoroom.PubSub,
          chat_topic(state.chat_id),
          {:new_message, msg_with_image}
        )

        new_messages = state.messages ++ [msg]
        {:reply, {:ok, msg}, %{state | messages: new_messages}}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:get_messages, :all}, _from, state) do
    if state.first_load do
      {:ok, messages_from_db} = Messages.get_chat_messages(state.chat_id)
      new_state = %{state | messages: messages_from_db, first_load: false}
      {:reply, messages_from_db, new_state}
    else
      {:ok, messages_from_db} = Messages.get_chat_messages(state.chat_id)
      new_state = %{state | messages: messages_from_db}
      {:reply, messages_from_db, new_state}
    end
  end

  def handle_call({:get_messages, limit}, _from, state) when is_integer(limit) do
    if state.first_load do
      {:ok, limited_messages_from_db} = Messages.get_chat_messages(state.chat_id, limit)
      new_state = %{state | messages: limited_messages_from_db, first_load: false}
      {:reply, limited_messages_from_db, new_state}
    else
      if length(state.messages) < limit do
        {:ok, limited_messages_from_db} = Messages.get_chat_messages(state.chat_id, limit)
        new_state = %{state | messages: limited_messages_from_db}
        {:reply, limited_messages_from_db, new_state}
      else
        limited_messages = state.messages |> Enum.reverse() |> Enum.take(limit) |> Enum.reverse()
        {:reply, limited_messages, state}
      end
    end
  end

  def handle_call(:join_chat, _from, state) do
    PubSub.subscribe(Pomoroom.PubSub, chat_topic(state.chat_id))
    {:reply, :ok, state}
  end

  def handle_call({:get_messages_before, before_inserted_at, limit, before_db_id}, _from, state) do
    {:ok, older_messages} =
      Messages.get_chat_messages_before(state.chat_id, before_inserted_at, limit, before_db_id)

    {:reply, older_messages, state}
  end

  def handle_info({:new_message, _msg_with_image}, state) do
    {:noreply, state}
  end

  def via_tuple(chat_id) do
    {:via, Registry, {Registry.Chat, chat_id}}
  end

  defp chat_topic(chat_id), do: "chat:#{chat_id}"
end
