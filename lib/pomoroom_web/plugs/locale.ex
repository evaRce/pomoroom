defmodule PomoroomWeb.Plugs.Locale do
  import Plug.Conn

  @locales ~w(es en)

  def init(default), do: default

  def call(conn, _default) do
    conn = fetch_query_params(conn)

    locale =
      valid_locale(conn.params["locale"]) ||
        valid_locale(get_session(conn, :locale)) ||
        Gettext.get_locale(PomoroomWeb.Gettext)

    Gettext.put_locale(PomoroomWeb.Gettext, locale)

    conn
    |> put_session(:locale, locale)
    |> assign(:locale, locale)
  end

  defp valid_locale(locale) when locale in @locales, do: locale
  defp valid_locale(_locale), do: nil
end
