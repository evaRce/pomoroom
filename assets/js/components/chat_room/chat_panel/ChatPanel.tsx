import React, { useState, useEffect, useRef, useCallback } from "react";
import { message } from "antd";
import { useEventContext, useEvent } from "../EventContext";
import MessageItem from "./body/MessageItem";
import ChatHeader from "./header/ChatHeader";
import ChatFooter from "./footer/ChatFooter";
import { PomodoroTimer } from "../pomodoro_timer/PomodoroTimer";
import { KanbanBoard } from "../kanban_board_panel/KanbanBoard";
import CallScreen from "../call_panel/CallScreen";
import { useCallContext } from "../call_panel/CallContext";
import { createTimer, hasTimer, updateTimer, type TimerState } from "../pomodoro_timer/pomodoroTimerStore";
import {
  getPomodoroNotifications,
  markPomodoroNotification,
} from "../pomodoro_timer/pomodoroNotificationStore";

interface ChatPanelProps {
  isVisibleDetail: boolean;
}

const TOP_SCROLL_THRESHOLD_PX = 12;

export default function ChatPanel({ isVisibleDetail }: ChatPanelProps) {
  const { addEvent, removeEvent } = useEventContext() as any;
  const { activeCallChatId, activeCallRoomName, connectedAt, isMinimized, setMinimized, setViewingChatId, leaveCall } =
    useCallContext();

  const [messages, setMessages] = useState<any[]>([]);
  const showListMessagesEvent = useEvent("show_list_messages");
  const showOlderMessagesEvent = useEvent("show_older_messages");
  const pomodoroStateLoadedEvent = useEvent("pomodoro_state_loaded");
  const timerFinishedEvent = useEvent("timer_finished");
  const startTimerEvent = useEvent("start_timer");
  const pauseTimerEvent = useEvent("pause_timer");
  const resetTimerEvent = useEvent("reset_timer");
  const setModeEvent = useEvent("set_mode");
  const updateConfigEvent = useEvent("update_config");
  const showMessageToSendEvent = useEvent("show_message_to_send");
  const showUserInfoEvent = useEvent("show_user_info");

  const [userLogin, setUserLogin] = useState<any>(null);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [isPrivateChat, setIsPrivateChat] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [activePluginId, setActivePluginId] = useState<string | null>(null);
  const [avatarByNickname, setAvatarByNickname] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<any>(null);
  const seenMessageIdsRef = useRef<Set<any>>(new Set());
  const previousScrollHeightRef = useRef(0);
  const isPrependingOlderRef = useRef(false);
  const lastAppliedPomodoroSignatureByChatRef = useRef<Record<string, string>>({});
  const pomodoroToastTimerRef = useRef<number | null>(null);
  const soundEndWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const soundEndBreak = useRef(new Audio("/sounds/happy-bells-notification.wav"));

  const normalizePomodoroTimerPayload = (payload: any): TimerState | null => {
    if (!payload) {
      return null;
    }

    const payloadConfig = payload.config || {};
    const payloadState = payload.state || {};
    const serverNow = payload.server_now ?? payloadState.server_now ?? Date.now();
    const serverClockOffsetMs = Date.now() - serverNow;
    const adjustedNowMs = Date.now() - serverClockOffsetMs;
    const payloadSettings = payloadState.settings || {};
    const settings = {
      workDuration: payloadSettings.workDuration ?? payloadConfig.work_duration ?? 0,
      shortBreakDuration: payloadSettings.shortBreakDuration ?? payloadConfig.short_break_duration ?? 0,
      longBreakDuration: payloadSettings.longBreakDuration ?? payloadConfig.long_break_duration ?? 0,
      cyclesBeforeLongBreak:
        payloadSettings.cyclesBeforeLongBreak ?? payloadConfig.cycles_before_long_break ?? 0,
    };
    const mode = payloadState.mode || "work";
    const modeSnapshots = payloadState.modeSnapshots || {
      work: settings.workDuration * 60,
      shortBreak: settings.shortBreakDuration * 60,
      longBreak: settings.longBreakDuration * 60,
    };
    const durationMs =
      payloadState.durationMs ??
      payloadState.duration_ms ??
      modeSnapshots[mode as keyof typeof modeSnapshots] * 1000;
    const startedAt = payloadState.startedAt ?? payloadState.started_at ?? null;
    const pausedAt = payloadState.pausedAt ?? payloadState.paused_at ?? null;
    const resolvedTimeLeft = (() => {
      if (Boolean(payloadState.isRunning ?? payloadState.is_running) && startedAt) {
        return Math.max(Math.ceil((durationMs - (adjustedNowMs - startedAt)) / 1000), 0);
      }

      if (startedAt && pausedAt) {
        return Math.max(Math.ceil((durationMs - (pausedAt - startedAt)) / 1000), 0);
      }

      return Math.max(Math.ceil(durationMs / 1000), 0);
    })();
    const lastUpdated = payloadState.lastUpdated ?? payloadState.last_updated ?? serverNow;
    const sessionElapsedMs = payloadState.sessionElapsedMs ?? payloadState.session_elapsed_ms ?? 0;
    const sessionStartedAt =
      payloadState.sessionStartedAt ?? payloadState.session_started_at ?? null;

    return {
      timeLeft: resolvedTimeLeft,
      isRunning: Boolean(payloadState.isRunning ?? payloadState.is_running),
      mode,
      cyclesCompleted: payloadState.cyclesCompleted ?? payloadState.cycles_completed ?? 0,
      hasPendingWorkHalfCycle: Boolean(
        payloadState.hasPendingWorkHalfCycle ?? payloadState.has_pending_work_half_cycle
      ),
      configVersion: payload.config_version ?? 0,
      settings,
      modeSnapshots,
      lastCompletedMode: payloadState.lastCompletedMode ?? payloadState.last_completed_mode ?? null,
      lastUpdated,
      startedAt,
      pausedAt,
      durationMs,
      serverClockOffsetMs,
      sessionElapsedMs,
      sessionStartedAt,
    };
  };

  const getPomodoroSignature = useCallback((eventName: string, payload: any) => {
    const state = payload?.state || {};

    return [
      eventName,
      payload?.chat_id || "",
      payload?.timer_id || "",
      payload?.config_version ?? 0,
      state.mode || state.last_completed_mode || "",
      state.started_at ?? state.startedAt ?? "",
      state.paused_at ?? state.pausedAt ?? "",
      state.last_updated ?? state.lastUpdated ?? "",
      state.time_left ?? state.timeLeft ?? "",
      state.session_started_at ?? state.sessionStartedAt ?? "",
      payload?.config?.work_duration ?? "",
      payload?.config?.short_break_duration ?? "",
      payload?.config?.long_break_duration ?? "",
      payload?.config?.cycles_before_long_break ?? "",
    ].join(":");
  }, []);

  const applyPomodoroEvent = useCallback((eventName: string, payload: any) => {
    const targetChatId = payload?.chat_id;

    if (!targetChatId) {
      return;
    }

    const nextTimer = normalizePomodoroTimerPayload(payload);
    if (!nextTimer) {
      return;
    }

    const signature = getPomodoroSignature(eventName, payload);
    const lastSignature = lastAppliedPomodoroSignatureByChatRef.current[targetChatId];

    if (lastSignature === signature) {
      return;
    }

    if (hasTimer(targetChatId)) {
      updateTimer(targetChatId, nextTimer);
    } else {
      createTimer(targetChatId, nextTimer);
    }

    lastAppliedPomodoroSignatureByChatRef.current[targetChatId] = signature;
  }, [getPomodoroSignature]);

  const syncPomodoroStore = useCallback((eventName: string, payload: any) => {
    if (!payload?.chat_id) {
      return;
    }

    applyPomodoroEvent(eventName, payload);
  }, [applyPomodoroEvent]);

  const getMessageUniqueKey = (message: any) => {
    const data = message?.data || {};

    if (data.msg_id) {
      return `msg:${data.msg_id}`;
    }

    if (data.db_id) {
      return `db:${data.db_id}`;
    }

    return `msg:${data.msg_id || ""}:${data.inserted_at || ""}:${data.from_user || ""}:${data.text || ""}`;
  };

  const buildUniqueMessagesAndSeedIds = (messagesList: any[]) => {
    const seenMessageIds = new Set<any>();
    const uniqueMessages: any[] = [];

    for (const message of messagesList) {
      const messageId = getMessageUniqueKey(message);

      if (!messageId) {
        continue;
      }

      if (!seenMessageIds.has(messageId)) {
        seenMessageIds.add(messageId);
        uniqueMessages.push(message);
      }
    }

    seenMessageIdsRef.current = seenMessageIds;
    return uniqueMessages;
  };

  useEffect(() => {
    if (showListMessagesEvent) {
      setMessages(buildUniqueMessagesAndSeedIds(showListMessagesEvent.messages || []));
      setCurrentChatId(showListMessagesEvent.chat_id || "");
      setViewingChatId(showListMessagesEvent.chat_id || null);
      setIsPrivateChat(!showListMessagesEvent.group_data);
      setAvatarByNickname(showListMessagesEvent.user_avatar_map || {});
      const hasMoreFromServer = typeof showListMessagesEvent.has_more === "boolean" ? showListMessagesEvent.has_more : false;
      setHasMoreOlder(hasMoreFromServer);
      setIsLoadingOlder(false);
      removeEvent("show_list_messages");
    }
  }, [showListMessagesEvent, setViewingChatId]);

  useEffect(() => {
    if (showOlderMessagesEvent) {
      const olderMessages = showOlderMessagesEvent.messages || [];
      const hasMore = Boolean(showOlderMessagesEvent.has_more);

      if (olderMessages.length > 0) {
        const container = messagesEndRef.current;
        if (container) {
          previousScrollHeightRef.current = container.scrollHeight;
          isPrependingOlderRef.current = true;
        }
        setMessages((prevMessages) =>
          buildUniqueMessagesAndSeedIds([...olderMessages, ...prevMessages])
        );
      }

      setHasMoreOlder(hasMore);
      setIsLoadingOlder(false);
      removeEvent("show_older_messages");
    }
  }, [showOlderMessagesEvent]);

  useEffect(() => {
    syncPomodoroStore("pomodoro_state_loaded", pomodoroStateLoadedEvent);
  }, [pomodoroStateLoadedEvent, syncPomodoroStore]);

  useEffect(() => {
    syncPomodoroStore("timer_finished", timerFinishedEvent);
  }, [timerFinishedEvent, syncPomodoroStore]);

  useEffect(() => {
    if (!timerFinishedEvent?.chat_id) return;

    const completedMode =
      timerFinishedEvent?.state?.lastCompletedMode ||
      timerFinishedEvent?.state?.last_completed_mode ||
      null;

    if (timerFinishedEvent.chat_id === currentChatId) {
      if (activePluginId !== "pomodoro") {
        const soundPlayer = completedMode === "work" ? soundEndWork.current : soundEndBreak.current;

        if (soundPlayer) {
          soundPlayer.currentTime = 0;
          void soundPlayer.play();
        }
      }

      removeEvent("timer_finished");
      return;
    }

    markPomodoroNotification(timerFinishedEvent.chat_id, completedMode);

    if (pomodoroToastTimerRef.current) {
      window.clearTimeout(pomodoroToastTimerRef.current);
    }

    pomodoroToastTimerRef.current = window.setTimeout(() => {
      const pendingChats = Object.values(getPomodoroNotifications()).filter(
        (notification) => notification.hasPendingNotification
      );

      if (pendingChats.length === 0) {
        pomodoroToastTimerRef.current = null;
        return;
      }

      const finishingCount = pendingChats.length;
      const toastMessage =
        finishingCount === 1
          ? "Un Pomodoro terminó en otro chat"
          : `${finishingCount} Pomodoros terminaron en otros chats`;

      message.info({ content: toastMessage });
      pomodoroToastTimerRef.current = null;
    }, 1500);

    removeEvent("timer_finished");
  }, [activePluginId, currentChatId, timerFinishedEvent]);

  useEffect(() => {
    syncPomodoroStore("start_timer", startTimerEvent);
  }, [startTimerEvent, syncPomodoroStore]);

  useEffect(() => {
    syncPomodoroStore("pause_timer", pauseTimerEvent);
  }, [pauseTimerEvent, syncPomodoroStore]);

  useEffect(() => {
    syncPomodoroStore("reset_timer", resetTimerEvent);
  }, [resetTimerEvent, syncPomodoroStore]);

  useEffect(() => {
    syncPomodoroStore("set_mode", setModeEvent);
  }, [setModeEvent, syncPomodoroStore]);

  useEffect(() => {
    syncPomodoroStore("update_config", updateConfigEvent);
  }, [updateConfigEvent, syncPomodoroStore]);

  useEffect(() => {
    return () => {
      if (pomodoroToastTimerRef.current) {
        window.clearTimeout(pomodoroToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showMessageToSendEvent) {
      const eventChatId = showMessageToSendEvent.message?.data?.chat_id || "";

      if (eventChatId && eventChatId === currentChatId) {
        addMessage(showMessageToSendEvent.message);
      }

      removeEvent("show_message_to_send");
    }
  }, [showMessageToSendEvent, currentChatId]);

  useEffect(() => {
    if (showUserInfoEvent) {
      setUserLogin(showUserInfoEvent);
    }
  }, [showUserInfoEvent]);

  useEffect(() => {
    return () => setViewingChatId(null);
  }, [setViewingChatId]);

  const addMessage = (message: any) => {
    if (!message || !message.data || message.data.text.trim() === "") {
      return; // No añadir mensajes vacíos
    }

    const messageId = getMessageUniqueKey(message);
    if (!messageId) {
      return;
    }

    if (messageId && seenMessageIdsRef.current.has(messageId)) {
      return;
    }

    seenMessageIdsRef.current.add(messageId);

    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const requestOlderMessages = () => {
    if (isLoadingOlder || !hasMoreOlder || !currentChatId || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    const oldestInsertedAt = oldestMessage?.data?.inserted_at;
    const oldestDbId = oldestMessage?.data?.db_id;

    if (!oldestInsertedAt) {
      return;
    }

    setIsLoadingOlder(true);
    addEvent("load_older_messages", {
      chat_id: currentChatId,
      before_inserted_at: oldestInsertedAt,
      before_db_id: oldestDbId,
    });
  };

  const handleMessagesScroll = (event: any) => {
    const target = event.currentTarget;

    if (target.scrollTop <= TOP_SCROLL_THRESHOLD_PX) {
      requestOlderMessages();
    }
  };

  useEffect(() => {
    const container = messagesEndRef.current;
    if (!container) {
      return;
    }

    if (isPrependingOlderRef.current) {
      const newScrollHeight = container.scrollHeight;
      const deltaHeight = newScrollHeight - previousScrollHeightRef.current;
      container.scrollTop = deltaHeight;
      isPrependingOlderRef.current = false;
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const renderPlugin = (pluginId: string) => {
    switch (pluginId) {
      case "pomodoro":
        return (
          <PomodoroTimer
            chatId={currentChatId}
            chatType={isPrivateChat ? "private" : "group"}
          />
        )
      case "kanban":
        return (
          <KanbanBoard
            chatId={currentChatId}
            chatType={isPrivateChat ? "private" : "group"}
          />
        )
      default:
        return null
    }
  }

  const handleTogglePluginTab = (pluginId: string | null) => {
    setActivePluginId(pluginId);
  };

  const hasCallForThisChat = !!currentChatId && activeCallChatId === currentChatId;
  const isCallScreenVisible = hasCallForThisChat && !isMinimized;

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-grow flex-col border-l border-r">
      {hasCallForThisChat && (
        <div className={`flex min-h-0 flex-1 flex-col ${isCallScreenVisible ? "" : "hidden"}`}>
          <CallScreen
            roomName={activeCallRoomName}
            connectedAt={connectedAt}
            avatarByNickname={avatarByNickname}
            onEndCall={leaveCall}
            onClose={() => setMinimized(true)}
          />
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col ${isCallScreenVisible ? "hidden" : ""}`}>
        <ChatHeader
          userLogin={userLogin}
          isVisibleDetail={isVisibleDetail}
          activePluginId={activePluginId}
          onTogglePluginTab={handleTogglePluginTab}
        />

        {/* Content area - either plugin or chat messages */}
        {activePluginId ? (
          <div
            className="min-h-0 min-w-0 flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {renderPlugin(activePluginId)}
          </div>
        ) : (
          <>
            {/* Messages area */}
            <main
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden border-b border-t p-5"
              style={{ scrollbarWidth: "thin" }}
              ref={messagesEndRef}
              onScroll={handleMessagesScroll}
            >
              {messages.length > 0 &&
                messages.map((message) => {
                  const isMyMessage = message.data.from_user === userLogin?.nickname;
                  const shouldHideIdentity = isPrivateChat || (isMyMessage && !isPrivateChat);

                  return (
                    <MessageItem
                      key={getMessageUniqueKey(message)}
                      message={message}
                      userLogin={userLogin}
                      hideSenderIdentity={shouldHideIdentity}
                    />
                  );
                })}
              <div></div>
            </main>

            {/* Message input area */}
            <ChatFooter />
          </>
        )}
      </div>
    </div>
  );
}
