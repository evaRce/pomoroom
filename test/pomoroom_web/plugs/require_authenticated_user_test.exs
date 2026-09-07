defmodule PomoroomWeb.Plugs.RequireAuthenticatedUserTest do
  use PomoroomWeb.ConnCase, async: true

  alias PomoroomWeb.Plugs.RequireAuthenticatedUser

  defp conn_with_session(session_data, conn) do
    conn
    |> Plug.Test.init_test_session(session_data)
    |> RequireAuthenticatedUser.call([])
  end

  test "lets the request through when the session has a nickname", %{conn: conn} do
    conn = conn_with_session(%{"user_info" => %{"nickname" => "eva"}}, conn)

    refute conn.halted
  end

  test "redirects to /login when the session has no user_info", %{conn: conn} do
    conn = conn_with_session(%{}, conn)

    assert conn.halted
    assert redirected_to(conn) == "/login"
  end

  test "redirects to /login when the nickname is blank", %{conn: conn} do
    conn = conn_with_session(%{"user_info" => %{"nickname" => ""}}, conn)

    assert conn.halted
    assert redirected_to(conn) == "/login"
  end

  test "redirects to /login when user_info has no nickname key", %{conn: conn} do
    conn = conn_with_session(%{"user_info" => %{}}, conn)

    assert conn.halted
    assert redirected_to(conn) == "/login"
  end
end
