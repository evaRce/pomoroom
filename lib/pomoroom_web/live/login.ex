defmodule PomoroomWeb.HomeLive.Login do
  use PomoroomWeb, :live_view
  alias Pomoroom.Users

  def mount(_params, session, socket) do
    {:ok, PhoenixLiveSession.maybe_subscribe(socket, session), layout: false}
  end

  def handle_event("action.log_user", %{"email" => email, "password" => password}, socket) do
    case Users.get_with_passw("email", email) do
      {:error, :not_found} ->
        {:noreply,
         push_event(socket, "react.error_login_user", %{
           errors: %{email: "El email o la contraseña no son válidos"}
         })}

      {:ok, user_changes} ->
        if Bcrypt.verify_pass(password, user_changes.password) do
          user_info = Map.drop(user_changes, [:password])
          socket = PhoenixLiveSession.put_session(socket, "user_info", user_info)
          {:noreply, redirect(socket, to: "/chat")}
        else
          {:noreply,
           push_event(socket, "react.error_login_user", %{
             errors: %{password: "El email o la contraseña no son válidos"}
           })}
        end
    end
  end
end
