import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Avatar, Button } from "antd";
import { Info, Puzzle, UserPlus } from "lucide-react";
import { useEventContext } from "../../EventContext";
import AddMembersModal from "./AddMembersModal";
import CallPanel from "../../call_panel/CallPanel";
import PluginMarketPlace, { AvailablePlugin, InstalledPlugin } from "../PluginMarketPlace";
import { getTimer, subscribeTimer, type TimerState } from "../../pomodoro_timer/pomodoroTimerStore";

interface ChatHeaderProps {
  userLogin: any;
  isVisibleDetail: boolean;
  activePluginId: string | null;
  onTogglePluginTab: (pluginId: string | null) => void;
}

export default function ChatHeader({
  userLogin,
  isVisibleDetail,
  activePluginId,
  onTogglePluginTab,
}: ChatHeaderProps) {
  const { addEvent, getEventData, removeEvent } = useEventContext() as any;
  const [pluginDisplayMap, setPluginDisplayMap] = useState<Record<string, { name: string; icon: string }>>({});
  const [chatData, setChatData] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkAdmin, setCheckAdmin] = useState<any>({});
  const [chatName, setChatName] = useState("");
  const [chatImage, setChatImage] = useState("");
  const [isGroupMemberRemoved, setIsGroupMemberRemoved] = useState(false);
  const [isPluginMarketplaceOpen, setIsPluginMarketplaceOpen] = useState(false);
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [pendingPluginId, setPendingPluginId] = useState<string | null>(null);
  const isGroupChat = Boolean(chatData?.group_data);
  const currentChatId = chatData?.chat_id || chatData?.group_data?.chat_id || "";
  const currentGroupName = chatData?.group_data?.name || "";

  useEffect(() => {
    let cancelled = false;

    const loadPluginCatalog = async () => {
      try {
        const res = await fetch("/api/plugins", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const payload = await res.json();
        const plugins = Array.isArray(payload?.data) ? payload.data : [];

        const map: Record<string, { name: string; icon: string }> = {};
        plugins.forEach((p: any) => {
          if (p?.type) {
            map[p.type] = { name: p.name || p.type, icon: p.icon || "🔌" };
          }
        });

        if (!cancelled) setPluginDisplayMap(map);
      } catch (_e) {
        // ignore errors; fallback to empty map
      }
    };

    loadPluginCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizePlugin = (plugin: any) => {
    const normalizedType = plugin?.type;

    if (!normalizedType) return null;

    const displayData = pluginDisplayMap[normalizedType] || {};
    const normalizedId = plugin?.id || "";


    return {
      id: normalizedId,
      type: normalizedType,
      name: plugin.name || displayData.name || normalizedType,
      icon: plugin.icon || displayData.icon || "🔌",
    } as InstalledPlugin;
  };

  const normalizeInstalledPlugins = (plugins: any[] = []) => {
    const merged: InstalledPlugin[] = [];

    plugins.forEach((plugin) => {
      const normalized = normalizePlugin(plugin);

      if (!normalized) {
        return;
      }

      if (merged.some((existing) => existing.type === normalized.type)) {
        return;
      }

      merged.push(normalized);
    });

    return merged;
  };

  const pomodoroTimer = useSyncExternalStore(
    (listener) => {
      if (!currentChatId) return () => { };
      return subscribeTimer(currentChatId, () => listener());
    },
    () => (currentChatId ? getTimer(currentChatId) : undefined),
    () => undefined
  ) as TimerState | undefined;

  useEffect(() => {
    const privateChat = getEventData("open_private_chat");

    if (privateChat) {
      setChatData(privateChat);
      setInstalledPlugins(normalizeInstalledPlugins(privateChat.plugins));
      removeEvent("active_chat_context");
      addEvent("active_chat_context", privateChat);
      onTogglePluginTab(null);
    }
  }, [getEventData("open_private_chat")]);

  useEffect(() => {
    const groupChat = getEventData("open_group_chat");
    if (groupChat) {
      setChatData(groupChat);
      setIsGroupMemberRemoved(Boolean(groupChat.removed_at));
      setInstalledPlugins(normalizeInstalledPlugins(groupChat.plugins));
      removeEvent("active_chat_context");
      addEvent("active_chat_context", groupChat);
      onTogglePluginTab(null);
    }
  }, [getEventData("open_group_chat")]);

  useEffect(() => {
    const pluginInstalledEvent = getEventData("chat_plugin_installed");

    if (!pluginInstalledEvent) {
      return;
    }

    if (pluginInstalledEvent.chat_id !== currentChatId) {
      removeEvent("chat_plugin_installed");
      return;
    }

    const installedPlugin = normalizePlugin(pluginInstalledEvent.plugin);

    if (!installedPlugin) {
      removeEvent("chat_plugin_installed");
      return;
    }

    setInstalledPlugins((prevPlugins) => {
      if (prevPlugins.some((plugin) => plugin.type === installedPlugin.type)) {
        return prevPlugins;
      }

      return [...prevPlugins, installedPlugin];
    });

    setPendingPluginId(null);

    removeEvent("chat_plugin_installed");
  }, [getEventData("chat_plugin_installed"), currentChatId]);

  useEffect(() => {
    const pluginInstallFailedEvent = getEventData("chat_plugin_install_failed");

    if (!pluginInstallFailedEvent) {
      return;
    }

    if (pluginInstallFailedEvent.chat_id !== currentChatId) {
      removeEvent("chat_plugin_install_failed");
      return;
    }

    setPendingPluginId(null);
    removeEvent("chat_plugin_install_failed");
  }, [getEventData("chat_plugin_install_failed"), currentChatId]);

  useEffect(() => {
    const pluginUninstalledEvent = getEventData("chat_plugin_uninstalled");

    if (!pluginUninstalledEvent) {
      return;
    }

    if (pluginUninstalledEvent.chat_id !== currentChatId) {
      removeEvent("chat_plugin_uninstalled");
      return;
    }

    const uninstalledPlugin = normalizePlugin(pluginUninstalledEvent.plugin);

    if (!uninstalledPlugin) {
      removeEvent("chat_plugin_uninstalled");
      return;
    }

    setInstalledPlugins((prevPlugins) =>
      prevPlugins.filter((plugin) => plugin.type !== uninstalledPlugin.type)
    );

    if (activePluginId === uninstalledPlugin.type) {
      onTogglePluginTab(null);
    }

    setPendingPluginId(null);

    removeEvent("chat_plugin_uninstalled");
  }, [getEventData("chat_plugin_uninstalled"), currentChatId, activePluginId]);

  useEffect(() => {
    const pluginUninstallFailedEvent = getEventData("chat_plugin_uninstall_failed");

    if (!pluginUninstallFailedEvent) {
      return;
    }

    if (pluginUninstallFailedEvent.chat_id !== currentChatId) {
      removeEvent("chat_plugin_uninstall_failed");
      return;
    }

    setPendingPluginId(null);
    removeEvent("chat_plugin_uninstall_failed");
  }, [getEventData("chat_plugin_uninstall_failed"), currentChatId]);

  useEffect(() => {
    const groupMemberRemovedEvent = getEventData("group_member_removed");
    const isRemovedEventForCurrentChat =
      groupMemberRemovedEvent &&
      ((currentChatId && groupMemberRemovedEvent.chat_id && currentChatId === groupMemberRemovedEvent.chat_id) ||
        (currentGroupName &&
          groupMemberRemovedEvent.group_name &&
          currentGroupName === groupMemberRemovedEvent.group_name));

    if (groupMemberRemovedEvent && isRemovedEventForCurrentChat) {
      setIsGroupMemberRemoved(true);
      addEvent("toggle_detail_visibility", {
        is_visible: false,
        is_group: true,
        group_name: groupMemberRemovedEvent.group_name,
      });
    }
  }, [getEventData("group_member_removed"), currentChatId, currentGroupName]);

  useEffect(() => {
    const groupMemberAddedEvent = getEventData("group_member_added");

    const isAddedEventForCurrentChat =
      groupMemberAddedEvent &&
      ((currentChatId && groupMemberAddedEvent.chat_id && currentChatId === groupMemberAddedEvent.chat_id) ||
        (currentGroupName &&
          groupMemberAddedEvent.group_name &&
          currentGroupName === groupMemberAddedEvent.group_name));

    if (groupMemberAddedEvent && isAddedEventForCurrentChat) {
      setIsGroupMemberRemoved(false);
      setChatData((prevChatData: any) =>
        prevChatData
          ? {
            ...prevChatData,
            removed_at: null,
          }
          : prevChatData
      );

      if (typeof groupMemberAddedEvent.is_admin === "boolean") {
        setCheckAdmin({ is_admin: groupMemberAddedEvent.is_admin });
      }

      removeEvent("group_member_removed");
    }
  }, [getEventData("group_member_added"), currentChatId, currentGroupName]);

  useEffect(() => {
    const adminData = getEventData("check_admin");

    if (adminData) {
      setCheckAdmin({ is_admin: Boolean(adminData?.is_admin) });
      removeEvent("check_admin");
    }
  }, [getEventData("check_admin")]);

  useEffect(() => {
    const groupAdminUpdatedEvent = getEventData("group_admin_updated");

    const isAdminUpdateForCurrentChat =
      groupAdminUpdatedEvent &&
      ((currentChatId && groupAdminUpdatedEvent.chat_id && currentChatId === groupAdminUpdatedEvent.chat_id) ||
        (currentGroupName &&
          groupAdminUpdatedEvent.group_name &&
          currentGroupName === groupAdminUpdatedEvent.group_name));

    if (groupAdminUpdatedEvent && isAdminUpdateForCurrentChat) {
      setCheckAdmin({ is_admin: Boolean(groupAdminUpdatedEvent.is_admin) });
    }
  }, [getEventData("group_admin_updated"), currentChatId, currentGroupName]);

  useEffect(() => {
    const membersSnapshot = getEventData("members_snapshot");
    const currentNickname = userLogin?.nickname;

    if (!membersSnapshot?.members || !currentNickname || !isGroupChat) {
      return;
    }

    const currentMember = membersSnapshot.members.find(
      (member: any) => member?.nickname === currentNickname
    );

    if (currentMember) {
      const nextIsAdmin = Boolean(currentMember.is_admin);
      const nextIsRemoved = Boolean(currentMember.removed_at);
      setCheckAdmin({ is_admin: nextIsAdmin });
      setIsGroupMemberRemoved(nextIsRemoved);
      removeEvent("members_snapshot");
    }
  }, [getEventData("members_snapshot"), userLogin?.nickname, isGroupChat]);

  useEffect(() => {
    if (chatData) {
      setChatName(setNameChat());
      setChatImage(setImageProfile());
    }
  }, [chatData]);

  const showUserDetails = () => {
    if (isGroupChat && isGroupMemberRemoved) {
      return;
    }

    addEvent("toggle_detail_visibility", {
      is_visible: !isVisibleDetail,
      is_group: isGroupChat,
      group_name: chatName,
    });
    addEvent("show_detail", {
      chat_name: chatName,
      image: chatImage,
      is_group: isGroupChat,
      chat_id: currentChatId,
      group_name: currentGroupName,
    });
  };

  const setImageProfile = () => {
    if (chatData.group_data) {
      return chatData.group_data.image;
    } else {
      if (userLogin.nickname === chatData.from_user_data.nickname) {
        return chatData.to_user_data.image_profile;
      } else if (userLogin.nickname === chatData.to_user_data.nickname) {
        return chatData.from_user_data.image_profile;
      }
    }
  };

  const setNameChat = () => {
    if (chatData.group_data) {
      return chatData.group_data.name;
    } else {
      if (userLogin.nickname === chatData.from_user_data.nickname) {
        return chatData.to_user_data.nickname;
      } else if (userLogin.nickname === chatData.to_user_data.nickname) {
        return chatData.from_user_data.nickname;
      }
    }
  };

  const openAddMembersModal = () => {
    addEvent("get_my_contacts", { group_name: chatData.group_data.name });
    setIsModalVisible(true);
  };

  const handleModalVisible = (isModalVisible: boolean) => {
    setIsModalVisible(isModalVisible);
  };

  const openPluginMarketplace = () => {
    setIsPluginMarketplaceOpen(true);
  };

  const handleInstallPlugin = (plugin: AvailablePlugin) => {
    if (!currentChatId) {
      return;
    }

    setPendingPluginId(plugin.type);
    addEvent("install_chat_plugin", {
      chat_id: currentChatId,
      chat_type: isGroupChat ? "group" : "private",
      plugin_type: plugin.type,
    });
  };

  const handleUninstallPlugin = (pluginId: string) => {
    if (!currentChatId) {
      return;
    }

    setPendingPluginId(pluginId);
    addEvent("uninstall_chat_plugin", {
      chat_id: currentChatId,
      chat_type: isGroupChat ? "group" : "private",
      plugin_id: pluginId,
    });
  };

  const togglePluginTab = (pluginId: string | null) => {
    if (activePluginId === pluginId) {
      onTogglePluginTab(null);
      return;
    }

    onTogglePluginTab(pluginId);
  };

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
      {chatData && (
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={showUserDetails}
              className="flex items-center gap-3 text-left"
            >
              <Avatar
                size={40}
                src={chatImage}
                className="bg-white text-blue-700 font-semibold"
              >
                {chatName?.charAt(0)?.toUpperCase()}
              </Avatar>

              <div className="flex items-start">
                <span className="text-sm font-semibold text-gray-900 truncate">{chatName}</span>
              </div>
            </button>

            {installedPlugins.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => togglePluginTab(null)}
                  className={`h-8 rounded-md border px-3 text-xs font-medium transition-all ${activePluginId === null
                    ? "border-sky-200 bg-sky-100 text-sky-800"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  💬 Chat
                </button>
                {installedPlugins.map((plugin) => (
                  <button
                    type="button"
                    key={plugin.type}
                    onClick={() => togglePluginTab(plugin.type)}
                    title={plugin.name}
                    className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-all ${activePluginId === plugin.type
                      ? "border-sky-200 bg-sky-100 text-sky-800"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <span className="shrink-0">{plugin.icon}</span>
                    {plugin.name}
                    {plugin.type === "pomodoro" && pomodoroTimer?.isRunning && (
                      <span
                        className={`ml-1 inline-block h-2 w-2 shrink-0 rounded-full ${pomodoroTimer.mode === "work"
                            ? "bg-sky-500"
                            : pomodoroTimer.mode === "shortBreak"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {chatData?.group_data && checkAdmin.is_admin && !isGroupMemberRemoved && (
              <Button
                type="text"
                className="!h-9 !w-9 !rounded-lg text-gray-600 hover:!bg-blue-50 hover:!text-blue-600"
                icon={<UserPlus className="h-5 w-5" />}
                onClick={openAddMembersModal}
                title="Añadir miembros"
              />
            )}

            {!chatData?.group_data && <CallPanel chatName={chatName} userLogin={userLogin} />}

            <Button
              type="text"
              className="!h-9 !w-9 !rounded-lg text-gray-600 hover:!bg-blue-50 hover:!text-blue-600"
              icon={<Puzzle className="h-5 w-5" />}
              onClick={openPluginMarketplace}
              title="Plugins"
              disabled={isGroupChat && isGroupMemberRemoved}
            />

            <Button
              type="text"
              className={`!h-9 !w-9 !rounded-lg ${isVisibleDetail
                ? "!bg-blue-50 !text-blue-600"
                : "text-gray-600 hover:!bg-gray-100 hover:!text-gray-900"
                }`}
              icon={<Info className="h-5 w-5" />}
              onClick={showUserDetails}
              title="Detalles del contacto"
              disabled={isGroupChat && isGroupMemberRemoved}
            />
          </div>
        </div>
      )}

      {chatData?.group_data && (
        <AddMembersModal
          chatData={chatData}
          isModalVisibleFromAddContacts={handleModalVisible}
          isModalVisibleFromHeader={isModalVisible}
        />
      )}

      <PluginMarketPlace
        open={isPluginMarketplaceOpen}
        onOpenChange={setIsPluginMarketplaceOpen}
        installedPlugins={installedPlugins}
        onInstallPlugin={handleInstallPlugin}
        onUninstallPlugin={handleUninstallPlugin}
        pendingPluginId={pendingPluginId}
      />
    </header>
  );
}
