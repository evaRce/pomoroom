defmodule PomoroomWeb.PageController do
  use PomoroomWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :home, layout: false)
  end

  def logout(conn, _params) do
    locale = get_session(conn, :locale)

    conn
    |> configure_session(renew: true)
    |> clear_session()
    |> put_session(:locale, locale)
    |> redirect(to: "/login")
  end
end
