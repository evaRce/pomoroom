defmodule PomoroomWeb.HomeLive.SignUpTest do
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

  defp mount_sign_up(conn, last_byte) do
    conn =
      Plug.Conn.put_private(conn, :live_view_connect_info, %{
        peer_data: %{address: {127, 0, 0, last_byte}},
        session: build_full_session()
      })

    live(conn, "/signup")
  end

  defp valid_params(nickname) do
    %{
      "email" => "#{nickname}@h.es",
      "nickname" => nickname,
      "password" => "password_1",
      "password_confirmation" => "password_1"
    }
  end

  test "renders the sign up island", %{conn: conn} do
    {:ok, _view, html} = mount_sign_up(conn, 1)

    assert html =~ ~s(id="signup")
  end

  test "registers a new user and redirects to /chat", %{conn: conn} do
    {:ok, view, _html} = mount_sign_up(conn, 2)

    render_hook(view, "action.save_user", valid_params("new_user"))

    assert_redirect(view, "/chat")
    assert Users.exists_nickname?("new_user")
  end

  test "rejects a duplicate nickname", %{conn: conn} do
    {:ok, _user} =
      Users.register_user(%{
        email: "existing@h.es",
        nickname: "existing_user",
        password: "password_1",
        password_confirmation: "password_1"
      })

    {:ok, view, _html} = mount_sign_up(conn, 3)

    render_hook(view, "action.save_user", valid_params("existing_user"))

    assert_push_event(view, "react.error_save_user", %{
      errors: %{nickname: "Este nickname ya está asociado a otra cuenta"}
    })
  end

  test "rejects mismatched password confirmation", %{conn: conn} do
    {:ok, view, _html} = mount_sign_up(conn, 4)

    params = valid_params("mismatch_user") |> Map.put("password_confirmation", "other_password")

    render_hook(view, "action.save_user", params)

    assert_push_event(view, "react.error_save_user", %{errors: %{confirmPassword: _message}})
  end

  test "rate limits repeated sign up attempts from the same client", %{conn: conn} do
    {:ok, view, _html} = mount_sign_up(conn, 5)

    Enum.each(1..3, fn n ->
      params = valid_params("dup_user") |> Map.put("password_confirmation", "other")
      render_hook(view, "action.save_user", params)

      assert_push_event(view, "react.error_save_user", %{errors: %{confirmPassword: _}})
      _ = n
    end)

    render_hook(view, "action.save_user", valid_params("blocked_user"))

    assert_push_event(view, "react.error_save_user", %{
      errors: %{email: "Demasiados intentos. Inténtalo de nuevo en unos minutos"}
    })
  end
end
