defmodule PomoroomWeb.PageControllerTest do
  use PomoroomWeb.ConnCase

  test "GET / renders the Spanish home page", %{conn: conn} do
    conn = get(conn, ~p"/?locale=es")
    response = html_response(conn, 200)

    assert response =~ "Conecta. Colabora. Crea."
    assert response =~ "Iniciar sesión"
    assert response =~ "Registrarse"
  end

  test "GET / renders the English home page", %{conn: conn} do
    conn = get(conn, ~p"/?locale=en")
    response = html_response(conn, 200)

    assert response =~ "Connect. Collaborate. Create."
    assert response =~ "Log in"
    assert response =~ "Sign up"
  end
end
