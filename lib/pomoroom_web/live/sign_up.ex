defmodule PomoroomWeb.HomeLive.SignUp do
  use PomoroomWeb, :live_view
  alias Pomoroom.Users

  @default_rate_limit [max_attempts: 3, scale_ms: :timer.minutes(30)]

  defp rate_limit_config do
    Keyword.merge(@default_rate_limit, Application.get_env(:pomoroom, :sign_up_rate_limit, []))
  end

  def mount(_params, session, socket) do
    socket =
      socket
      |> assign(:client_ip, client_ip(socket))
      |> assign(:locale, Map.get(session, "locale", "es"))

    {:ok, PhoenixLiveSession.maybe_subscribe(socket, session), layout: false}
  end

  def handle_info({:live_session_updated, session}, socket) do
    locale = Map.get(session, "locale", socket.assigns.locale)
    Gettext.put_locale(PomoroomWeb.Gettext, locale)
    {:noreply, assign(socket, :locale, locale)}
  end

  def handle_event(
        "action.save_user",
        params,
        %{assigns: %{client_ip: client_ip}} = socket
      ) do
    config = rate_limit_config()

    case PomoroomWeb.RateLimiter.hit(
           "sign_up:#{client_ip}",
           config[:scale_ms],
           config[:max_attempts]
         ) do
      {:deny, _retry_after} ->
        {:noreply,
         push_event(socket, "react.error_save_user", %{
           errors: %{email: gettext("Demasiados intentos. Inténtalo de nuevo en unos minutos")}
         })}

      {:allow, _count} ->
        do_save_user(params, socket)
    end
  end

  defp do_save_user(params, socket) do
    case Users.register_user(params) do
      {:ok, user_changes} ->
        user_info = Map.drop(user_changes, [:password])
        socket = PhoenixLiveSession.put_session(socket, "user_info", user_info)
        {:noreply, redirect(socket, to: "/chat")}

      {:error, reason} ->
        {:noreply,
         push_event(socket, "react.error_save_user", %{errors: remap_error_keys(reason)})}
    end
  end

  defp remap_error_keys(errors) do
    case Map.pop(errors, :password_confirmation) do
      {nil, errors} -> errors
      {message, errors} -> Map.put(errors, :confirmPassword, message)
    end
  end

  defp client_ip(socket) do
    case get_connect_info(socket, :peer_data) do
      %{address: address} -> address |> :inet.ntoa() |> to_string()
      _ -> "unknown"
    end
  end
end
