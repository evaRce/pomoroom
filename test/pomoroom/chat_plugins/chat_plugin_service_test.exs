defmodule Pomoroom.ChatPlugins.ChatPluginServiceTest do
  use Pomoroom.IntegrationCase, async: false

  alias Pomoroom.ChatPlugins.ChatPluginService
  alias Pomoroom.{PrivateChats, Users}

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

  defp create_chat do
    user1 = register("from_user1")
    user2 = register("to_user2")

    {:ok, chat} = PrivateChats.create_private_chat(user2.nickname, user1.nickname)
    chat.chat_id
  end

  test "lists the two available plugin types with metadata" do
    plugins = ChatPluginService.list_available_plugins()

    assert Enum.map(plugins, & &1.type) == ["kanban", "pomodoro"]
    assert Enum.all?(plugins, & &1.installable)
  end

  test "installs the kanban plugin on a chat and marks it as installed" do
    chat_id = create_chat()

    refute ChatPluginService.plugin_installed?(chat_id, "private", "kanban")

    {:ok, plugin} = ChatPluginService.install_plugin(chat_id, "private", "kanban")

    assert plugin.type == "kanban"
    assert ChatPluginService.plugin_installed?(chat_id, "private", "kanban")
  end

  test "installs the pomodoro plugin on a chat and marks it as installed" do
    chat_id = create_chat()

    {:ok, plugin} = ChatPluginService.install_plugin(chat_id, "private", "pomodoro")

    assert plugin.type == "pomodoro"
    assert ChatPluginService.plugin_installed?(chat_id, "private", "pomodoro")
  end

  test "rejects installing the same plugin twice" do
    chat_id = create_chat()

    {:ok, _plugin} = ChatPluginService.install_plugin(chat_id, "private", "kanban")

    assert ChatPluginService.install_plugin(chat_id, "private", "kanban") ==
             {:error, :plugin_already_installed}
  end

  test "rejects installing an unsupported plugin type" do
    chat_id = create_chat()

    assert ChatPluginService.install_plugin(chat_id, "private", "not_a_real_plugin") ==
             {:error, :unsupported_plugin}
  end

  test "uninstalls an installed plugin by id" do
    chat_id = create_chat()

    {:ok, plugin} = ChatPluginService.install_plugin(chat_id, "private", "kanban")

    {:ok, uninstalled} = ChatPluginService.uninstall_plugin_by_id(chat_id, "private", plugin.id)

    assert uninstalled.type == "kanban"
    refute ChatPluginService.plugin_installed?(chat_id, "private", "kanban")
  end

  test "reports uninstalling a plugin that was never installed" do
    chat_id = create_chat()

    assert ChatPluginService.uninstall_plugin_by_id(chat_id, "private", "missing_plugin_id") ==
             {:error, :plugin_not_installed}
  end

  test "starts both installed plugin processes for a chat" do
    chat_id = create_chat()

    {:ok, _kanban} = ChatPluginService.install_plugin(chat_id, "private", "kanban")
    {:ok, _pomodoro} = ChatPluginService.install_plugin(chat_id, "private", "pomodoro")

    assert ChatPluginService.start_plugins_for_chat(chat_id, "private") == :ok
  end

  test "reports a chat that does not exist when starting its plugins" do
    assert ChatPluginService.start_plugins_for_chat("missing_chat_id", "private") ==
             {:error, "Chat no encontrado"}
  end
end
