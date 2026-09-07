defmodule PomoroomWeb.GroupInviteLinkTest do
  use PomoroomWeb.ConnCase, async: false

  import Phoenix.LiveViewTest

  alias Pomoroom.{GroupChats, Users}

  setup do
    Users.delete_all_users()
    GroupChats.delete_all_group_chats()
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

  defp build_full_session(extra) do
    opts = session_opts()
    data = Map.merge(%{"locale" => "es"}, extra)
    sid = PhoenixLiveSession.put(nil, nil, data, opts)
    {_sid, session} = PhoenixLiveSession.get(nil, sid, opts)
    session
  end

  defp mount_invite(conn, token, last_byte, session_extra \\ %{}) do
    conn =
      conn
      |> Plug.Test.init_test_session(session_extra)
      |> Plug.Conn.put_private(:live_view_connect_info, %{
        peer_data: %{address: {127, 0, 0, last_byte}},
        session: build_full_session(session_extra)
      })

    live(conn, "/invite/#{token}")
  end

  defp register(nickname) do
    {:ok, user} =
      Users.register_user(%{
        email: "#{nickname}@h.es",
        nickname: nickname,
        password: "password_1",
        password_confirmation: "password_1"
      })

    user
  end

  defp invite_token(chat_id) do
    "/invite/" <> token = URI.parse(GroupChats.build_invite_link(chat_id)).path
    token
  end

  test "redirects to login when there is no authenticated user", %{conn: conn} do
    admin = register("group_admin1")
    {:ok, group} = GroupChats.create_group_chat(admin.nickname, "Grupo")
    token = invite_token(group.chat_id)

    {:error, {:redirect, %{to: to}}} = mount_invite(conn, token, 1)

    assert to == "/login?invite=#{token}"
  end

  test "shows a confirmation screen for a non-member invitee", %{conn: conn} do
    admin = register("group_admin2")
    invitee = register("invitee_user2")
    {:ok, group} = GroupChats.create_group_chat(admin.nickname, "Grupo")
    token = invite_token(group.chat_id)

    {:ok, _view, html} =
      mount_invite(conn, token, 2, %{"user_info" => %{nickname: invitee.nickname}})

    assert html =~ "Grupo"
  end

  test "redirects an already active member straight to the chat", %{conn: conn} do
    admin = register("group_admin3")
    {:ok, group} = GroupChats.create_group_chat(admin.nickname, "Grupo")
    token = invite_token(group.chat_id)

    {:error, {:redirect, %{to: to}}} =
      mount_invite(conn, token, 3, %{"user_info" => %{nickname: admin.nickname}})

    assert to == "/chat?open_group=Grupo"
  end

  test "shows an error screen for an unknown or expired token", %{conn: conn} do
    invitee = register("invitee_user4")
    bogus_token = Phoenix.Token.sign(PomoroomWeb.Endpoint, "group_invite", "missing-chat-id")

    {:ok, _view, html} =
      mount_invite(conn, bogus_token, 4, %{"user_info" => %{nickname: invitee.nickname}})

    assert html =~ "El grupo de este enlace ya no existe"
  end

  test "confirms joining the group and redirects to the chat", %{conn: conn} do
    admin = register("group_admin5")
    invitee = register("invitee_user5")
    {:ok, group} = GroupChats.create_group_chat(admin.nickname, "Grupo")
    token = invite_token(group.chat_id)

    {:ok, view, _html} =
      mount_invite(conn, token, 5, %{"user_info" => %{nickname: invitee.nickname}})

    render_click(view, "confirm_join", %{})

    assert_redirect(view, "/chat?open_group=Grupo")
    assert {:active, _joined_at} = GroupChats.member_state(group.name, invitee.nickname)
  end

  test "cancelling the join redirects to the chat without joining", %{conn: conn} do
    admin = register("group_admin6")
    invitee = register("invitee_user6")
    {:ok, group} = GroupChats.create_group_chat(admin.nickname, "Grupo")
    token = invite_token(group.chat_id)

    {:ok, view, _html} =
      mount_invite(conn, token, 6, %{"user_info" => %{nickname: invitee.nickname}})

    render_click(view, "cancel_join", %{})

    assert_redirect(view, "/chat")
    assert GroupChats.member_state(group.name, invitee.nickname) == :not_member
  end
end
