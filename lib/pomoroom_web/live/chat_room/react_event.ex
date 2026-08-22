defmodule PomoroomWeb.ChatLive.ChatRoom.ReactEvent do
  import Phoenix.LiveView, only: [push_event: 3]

  def notify_react(socket, %{event_name: event_name, event_data: event_data}) do
    notify_react(socket, event_name, event_data)
  end

  def notify_react(socket, event_name, event_data) do
    {:noreply, push_react(socket, event_name, event_data)}
  end

  def push_react(socket, event_name, event_data) do
    push_event(socket, "react", %{event_name: event_name, event_data: event_data})
  end
end
