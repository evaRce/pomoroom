defmodule PomoroomWeb.HomeLive.Login do
  use PomoroomWeb, :live_view
  alias Pomoroom.Users

  @max_attempts 3
  @scale_ms :timer.minutes(1)

  def mount(_params, session, socket) do
    socket = assign(socket, :client_ip, client_ip(socket))
    {:ok, PhoenixLiveSession.maybe_subscribe(socket, session), layout: false}
  end

  def handle_event(
        "action.log_user",
        %{"email" => email, "password" => password},
        %{assigns: %{client_ip: client_ip}} = socket
      ) do
    case PomoroomWeb.RateLimiter.hit("login:#{client_ip}", @scale_ms, @max_attempts) do
      {:deny, _retry_after} ->
        {:noreply,
         push_event(socket, "react.error_login_user", %{
           errors: %{email: "Demasiados intentos. Inténtalo de nuevo en un minuto"}
         })}

      {:allow, _count} ->
        do_log_user(email, password, socket)
    end
  end

  defp do_log_user(email, password, socket) do
    case Users.get_with_passw("email", email) do
      {:error, :not_found} ->
        {:noreply,
         push_event(socket, "react.error_login_user", %{
           errors: %{email: "El email o la contraseña no son válidos"}
         })}

      {:ok, user_changes} ->
        if Bcrypt.verify_pass(password, user_changes.password) do
          case Users.get_by("nickname", user_changes.nickname) do
            {:ok, user_info} ->
              socket = PhoenixLiveSession.put_session(socket, "user_info", user_info)
              {:noreply, redirect(socket, to: "/chat")}

            {:error, _reason} ->
              {:noreply,
               push_event(socket, "react.error_login_user", %{
                 errors: %{email: "No se pudo iniciar sesión. Inténtalo de nuevo"}
               })}
          end
        else
          {:noreply,
           push_event(socket, "react.error_login_user", %{
             errors: %{password: "El email o la contraseña no son válidos"}
           })}
        end
    end
  end

  defp client_ip(socket) do
    case get_connect_info(socket, :peer_data) do
      %{address: address} -> address |> :inet.ntoa() |> to_string()
      _ -> "unknown"
    end
  end
end
