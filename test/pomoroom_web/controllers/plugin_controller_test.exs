defmodule PomoroomWeb.PluginControllerTest do
  use PomoroomWeb.ConnCase

  test "GET /api/plugins lists the available plugin types", %{conn: conn} do
    conn = get(conn, ~p"/api/plugins")

    %{"data" => plugins} = json_response(conn, 200)

    assert Enum.map(plugins, & &1["type"]) == ["kanban", "pomodoro"]
  end

  test "GET /api/kanban/default-columns lists the default kanban columns", %{conn: conn} do
    conn = get(conn, ~p"/api/kanban/default-columns")

    %{"data" => columns} = json_response(conn, 200)

    assert Enum.map(columns, & &1["column_id"]) == ["todo", "inProgress", "done"]
  end
end
