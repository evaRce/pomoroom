defmodule PomoroomWeb.HomeLive.Login do
	use PomoroomWeb, :live_view
	alias Pomoroom.Repo
	alias Pomoroom.User

	# Asignamos el estado inicial del proceso
	def mount(_params, _session, socket) do
		socket = assign(socket, :count, 0)
		{:ok, socket}
	end

	def handle_event("action.log_user", %{"email" => email, "password"=> password}, socket) do
    user = Repo.get_by(User, email: email)

    case user do
      nil ->
        {:noreply, assign(socket, error: "Usuario no encontrado")}
      _ ->
        if Bcrypt.verify_pass(password, user.password) do
          {:noreply, redirect(socket, to: "/pomoroom/home")}
        else
          {:noreply, assign(socket, error: "Contraseña incorrecta")}
        end
    end
	end
end