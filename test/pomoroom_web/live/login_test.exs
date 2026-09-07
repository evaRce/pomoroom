defmodule PomoroomWeb.HomeLive.LoginTest do
  use PomoroomWeb.ConnCase, async: false

  import Phoenix.LiveViewTest

  alias Pomoroom.Users

  setup do
    Users.delete_all_users()
    :ok
  end

  defp session_opts do
    PhoenixLiveSession.init(
      pub_sub: Pomoroom.PubSub,
      key: "_pomoroom_key",
      signing_salt: "zVrLCel6",
      same_site: "Lax"
    )
  end

  defp build_full_session(extra \\ %{}) do
    opts = session_opts()
    data = Map.merge(%{"locale" => "es"}, extra)
    sid = PhoenixLiveSession.put(nil, nil, data, opts)
    {_sid, session} = PhoenixLiveSession.get(nil, sid, opts)
    session
  end

  defp mount_login(conn, last_byte) do
    conn =
      Plug.Conn.put_private(conn, :live_view_connect_info, %{
        peer_data: %{address: {127, 0, 0, last_byte}},
        session: build_full_session()
      })

    live(conn, "/login")
  end

  defp register(nickname, password \\ "password_1") do
    {:ok, user} =
      Users.register_user(%{
        email: "#{nickname}@h.es",
        nickname: nickname,
        password: password,
        password_confirmation: password
      })

    user
  end

  test "renders the login island", %{conn: conn} do
    {:ok, _view, html} = mount_login(conn, 1)

    assert html =~ ~s(id="login")
  end

  test "logs in a registered user and redirects to /chat", %{conn: conn} do
    register("login_user")

    {:ok, view, _html} = mount_login(conn, 2)

    render_hook(view, "action.log_user", %{
      "email" => "login_user@h.es",
      "password" => "password_1"
    })

    assert_redirect(view, "/chat")
  end

  test "rejects an unknown email", %{conn: conn} do
    {:ok, view, _html} = mount_login(conn, 3)

    render_hook(view, "action.log_user", %{
      "email" => "missing@h.es",
      "password" => "password_1"
    })

    assert_push_event(view, "react.error_login_user", %{
      errors: %{email: "El email o la contraseña no son válidos"}
    })
  end

  test "rejects a wrong password", %{conn: conn} do
    register("login_user2")

    {:ok, view, _html} = mount_login(conn, 4)

    render_hook(view, "action.log_user", %{
      "email" => "login_user2@h.es",
      "password" => "wrong_password"
    })

    assert_push_event(view, "react.error_login_user", %{
      errors: %{password: "El email o la contraseña no son válidos"}
    })
  end

  test "rejects blank credentials without hitting the database", %{conn: conn} do
    {:ok, view, _html} = mount_login(conn, 5)

    render_hook(view, "action.log_user", %{"email" => "", "password" => ""})

    assert_push_event(view, "react.error_login_user", %{
      errors: %{email: "El email o la contraseña no son válidos"}
    })
  end

  test "rate limits repeated login attempts from the same client", %{conn: conn} do
    {:ok, view, _html} = mount_login(conn, 6)

    Enum.each(1..3, fn _attempt ->
      render_hook(view, "action.log_user", %{"email" => "missing@h.es", "password" => "x"})

      assert_push_event(view, "react.error_login_user", %{
        errors: %{email: "El email o la contraseña no son válidos"}
      })
    end)

    render_hook(view, "action.log_user", %{"email" => "missing@h.es", "password" => "x"})

    assert_push_event(view, "react.error_login_user", %{
      errors: %{email: "Demasiados intentos. Inténtalo de nuevo en un minuto"}
    })
  end
end
