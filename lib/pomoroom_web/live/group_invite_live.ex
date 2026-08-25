defmodule PomoroomWeb.GroupInviteLive do
  use PomoroomWeb, :live_view

  alias Pomoroom.GroupChats

  def mount(%{"token" => token}, session, socket) do
    case authenticated_user_info(session) do
      nil ->
        PhoenixLiveSession.put_session(session, "pending_invite_token", token)
        {:ok, redirect(socket, to: "/login"), layout: false}

      user_info ->
        case GroupChats.join_via_invite_link(token, user_info.nickname) do
          {:ok, %{group_name: group_name}} ->
            PhoenixLiveSession.put_session(session, "pending_open_group", group_name)
            {:ok, redirect(socket, to: "/chat"), layout: false}

          {:error, reason} ->
            {:ok, assign(socket, :error_message, error_message(reason)), layout: false}
        end
    end
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
