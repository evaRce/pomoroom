defmodule PomoroomWeb.HomeLive.SignUp do
  use PomoroomWeb, :live_view
  alias Pomoroom.Users

  def mount(_params, session, socket) do
    {:ok, PhoenixLiveSession.maybe_subscribe(socket, session), layout: false}
  end

  def handle_event("action.save_user", params, socket) do
    case Users.register_user(params) do
      {:ok, user_changes} ->
        user_info = Map.drop(user_changes, [:password])
        socket = PhoenixLiveSession.put_session(socket, "user_info", user_info)
        {:noreply, redirect(socket, to: "/chat")}

      {:error, reason} ->
        {:noreply, push_event(socket, "react.error_save_user", %{errors: reason})}
    end
  end
end
