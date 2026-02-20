defmodule PomoroomWeb.HomeLive.SignUp do
  use PomoroomWeb, :live_view
  alias Pomoroom.Users

  def mount(_params, session, socket) do
    socket =
      socket
      |> PhoenixLiveSession.maybe_subscribe(session)

    {:ok, socket, layout: false}
  end

  def handle_event("action.save_user", params, socket) do
    register_user = Users.register_user(params)

    case register_user do
      {:ok, user_changes} ->
        {:ok, user_info} = Users.get_by("nickname", user_changes.nickname)
        socket = PhoenixLiveSession.put_session(socket, "user_info", user_info)
        {:noreply, redirect(socket, to: "/chat")}

      {:error, reason} ->
        {:noreply, push_event(socket, "react.error_save_user", %{errors: reason})}
    end
  end
end
