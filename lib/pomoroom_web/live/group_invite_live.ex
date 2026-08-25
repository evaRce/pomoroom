defmodule PomoroomWeb.GroupInviteLive do
  use PomoroomWeb, :live_view

  alias Pomoroom.GroupChats

  def mount(%{"token" => token}, session, socket) do
    socket = PhoenixLiveSession.maybe_subscribe(socket, session)

    case authenticated_user_info(session) do
      nil ->
        PhoenixLiveSession.put_session(session, "pending_invite_token", token)
        {:ok, redirect(socket, to: "/login"), layout: false}

      user_info ->
        case GroupChats.preview_invite(token, user_info.nickname) do
          {:ok, %{already_member: true, group_name: group_name}} ->
            PhoenixLiveSession.put_session(socket, "pending_open_group", group_name)
            {:ok, redirect(socket, to: "/chat"), layout: false}

          {:ok, %{already_member: false, group_name: group_name}} ->
            socket =
              socket
              |> assign(:view, :confirm)
              |> assign(:token, token)
              |> assign(:user_info, user_info)
              |> assign(:group_name, group_name)

            {:ok, socket, layout: false}

          {:error, reason} ->
            {:ok, assign_error(socket, reason), layout: false}
        end
    end
  end

  def handle_event("confirm_join", _params, socket) do
    %{token: token, user_info: user_info} = socket.assigns

    case GroupChats.join_via_invite_link(token, user_info.nickname) do
      {:ok, %{group_name: group_name}} ->
        PhoenixLiveSession.put_session(socket, "pending_open_group", group_name)
        {:noreply, redirect(socket, to: "/chat")}

      {:error, reason} ->
        {:noreply, assign_error(socket, reason)}
    end
  end

  def handle_event("cancel_join", _params, socket) do
    {:noreply, redirect(socket, to: "/chat")}
  end

  defp assign_error(socket, reason) do
    socket
    |> assign(:view, :error)
    |> assign(:error_message, error_message(reason))
  end

  defp error_message(%{error: message}), do: message
  defp error_message(message) when is_binary(message), do: message
  defp error_message(_), do: gettext("No se ha podido procesar el enlace de invitación")

  defp authenticated_user_info(session) do
    case Map.get(session, "user_info") do
      %{"nickname" => nickname} = user_info when is_binary(nickname) and nickname != "" ->
        user_info

      %{nickname: nickname} = user_info when is_binary(nickname) and nickname != "" ->
        user_info

      _ ->
        nil
    end
  end
end
