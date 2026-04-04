defmodule PomoroomWeb.Plugs.RequireAuthenticatedUser do
  import Plug.Conn
  import Phoenix.Controller

  def init(opts), do: opts

  def call(conn, _opts) do
    if authenticated?(get_session(conn, "user_info")) do
      conn
    else
      conn
      |> redirect(to: "/login")
      |> halt()
    end
  end

  defp authenticated?(%{"nickname" => nickname}) when is_binary(nickname), do: nickname != ""
  defp authenticated?(%{nickname: nickname}) when is_binary(nickname), do: nickname != ""
  defp authenticated?(_), do: false
end
