defmodule PomoroomWeb.PageController do
  use PomoroomWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :home, layout: false)
  end

  def logout(conn, _params) do
    conn
    |> configure_session(drop: true)
    |> clear_session()
    |> redirect(to: "/login")
  end
end
