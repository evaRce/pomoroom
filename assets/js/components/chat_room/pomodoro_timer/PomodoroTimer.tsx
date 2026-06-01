import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Sparkles,
} from "lucide-react";
import { message } from "antd";
import { Button } from "../../../../components-shadcn/ui/button";
import { cn } from "../../../../lib/utils";
import pomodoroTimerText from "./pomodoroTimerText";
import { useEventContext, useEvent } from "../EventContext";
import {
  PomodoroSettingsPopover,
  MAX_CYCLE_BEFORE_LONG_BREAK,
  MIN_CYCLE_BEFORE_LONG_BREAK,
  SaveState,
  TimerMode,
  TimerSettings,
} from "./PomodoroSettingsPopover";
import {
  subscribeTimer,
  type TimerState,
} from "./pomodoroTimerStore";

interface PomodoroTimerProps {
  chatId: string;
  chatType: "private" | "group";
}

export function PomodoroTimer({ chatId, chatType }: PomodoroTimerProps) {
  const { addEvent, removeEvent } = useEventContext() as any;
  const [settings, setSettings] = useState<TimerSettings | null>(null);
  const [timerSnapshot, setTimerSnapshot] = useState<TimerState | null>(null);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [hasPendingWorkHalfCycle, setHasPendingWorkHalfCycle] = useState(false);
  const [timerId, setTimerId] = useState("");
  const [configVersion, setConfigVersion] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(Date.now());

  // Refs
  const hasSyncedInitialTimerRef = useRef(false);
  const lastCompletionStampRef = useRef<string>("");
  const lastStateResyncStampRef = useRef<string>("");
  const soundEndWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const soundEndBreak = useRef(new Audio("/sounds/happy-bells-notification.wav"));

  // Events
  const configLoadedEvent = useEvent("pomodoro_state_loaded");
  const configUpdatedEvent = useEvent("update_config");
  const configErrorEvent = useEvent("pomodoro_plugin_config_error");

  // ============================================================================
  // HELPERS & VALIDATORS
  // ============================================================================

  const toPayloadConfig = useCallback((settings: TimerSettings) => ({
    work_duration: settings?.workDuration,
    short_break_duration: settings?.shortBreakDuration,
    long_break_duration: settings?.longBreakDuration,
    cycles_before_long_break: settings?.cyclesBeforeLongBreak,
  }), []);

  const applyIncomingConfig = useCallback((config: any) => {
    if (!config) return;

    setSettings({
      workDuration: config.work_duration,
      shortBreakDuration: config.short_break_duration,
      longBreakDuration: config.long_break_duration,
      cyclesBeforeLongBreak: config.cycles_before_long_break,
    });
  }, []);

  const applyIncomingTimerState = useCallback((eventPayload: any) => {
    if (!eventPayload) return;

    const payloadState = eventPayload.state || {};
    const payloadConfig = eventPayload.config || {};
    const serverNow = eventPayload.server_now ?? payloadState.server_now ?? Date.now();
    const serverClockOffsetMs = Date.now() - serverNow;
    const adjustedNowMs = Date.now() - serverClockOffsetMs;
    const payloadSettings = payloadState.settings || {};
    const nextSettings: TimerSettings = {
      workDuration: payloadSettings.workDuration ?? payloadConfig.work_duration ?? 0,
      shortBreakDuration: payloadSettings.shortBreakDuration ?? payloadConfig.short_break_duration ?? 0,
      longBreakDuration: payloadSettings.longBreakDuration ?? payloadConfig.long_break_duration ?? 0,
      cyclesBeforeLongBreak:
        payloadSettings.cyclesBeforeLongBreak ?? payloadConfig.cycles_before_long_break ?? 0,
    };
    const nextMode = payloadState.mode || "work";
    const nextModeSnapshots = payloadState.modeSnapshots || {
      work: nextSettings.workDuration * 60,
      shortBreak: nextSettings.shortBreakDuration * 60,
      longBreak: nextSettings.longBreakDuration * 60,
    };
    const nextDurationMs =
      payloadState.durationMs ??
      payloadState.duration_ms ??
      nextModeSnapshots[nextMode as keyof typeof nextModeSnapshots] * 1000;
    const nextStartedAt = payloadState.startedAt ?? payloadState.started_at ?? null;
    const nextPausedAt = payloadState.pausedAt ?? payloadState.paused_at ?? null;
    const resolvedTimeLeft = (() => {
      if (Boolean(payloadState.isRunning ?? payloadState.is_running) && nextStartedAt) {
        return Math.max(Math.ceil((nextDurationMs - (adjustedNowMs - nextStartedAt)) / 1000), 0);
      }

      if (nextStartedAt && nextPausedAt) {
        return Math.max(Math.ceil((nextDurationMs - (nextPausedAt - nextStartedAt)) / 1000), 0);
      }

      return Math.max(Math.ceil(nextDurationMs / 1000), 0);
    })();

    setSettings(nextSettings);
    setTimerSnapshot({
      timeLeft: resolvedTimeLeft,
      isRunning: Boolean(payloadState.isRunning ?? payloadState.is_running),
      mode: nextMode,
      cyclesCompleted: payloadState.cyclesCompleted ?? payloadState.cycles_completed ?? 0,
      hasPendingWorkHalfCycle: Boolean(
        payloadState.hasPendingWorkHalfCycle ?? payloadState.has_pending_work_half_cycle
      ),
      configVersion: eventPayload.config_version ?? 0,
      settings: nextSettings,
      modeSnapshots: nextModeSnapshots,
      lastCompletedMode: payloadState.lastCompletedMode ?? payloadState.last_completed_mode ?? null,
      lastUpdated: payloadState.lastUpdated ?? payloadState.last_updated ?? Date.now(),
      startedAt: nextStartedAt,
      pausedAt: nextPausedAt,
      durationMs: nextDurationMs,
      serverClockOffsetMs,
    });

    setMode(nextMode);
    setIsRunning(Boolean(payloadState.isRunning ?? payloadState.is_running));
    setCyclesCompleted(payloadState.cyclesCompleted ?? payloadState.cycles_completed ?? 0);
    setHasPendingWorkHalfCycle(
      Boolean(payloadState.hasPendingWorkHalfCycle ?? payloadState.has_pending_work_half_cycle)
    );
    setConfigVersion(eventPayload.config_version ?? 0);
    setTimerId(eventPayload.timer_id || "");
    setNowMs(Date.now());
    lastCompletionStampRef.current = `${payloadState.lastCompletedMode || payloadState.last_completed_mode || "none"}:${payloadState.lastUpdated ?? payloadState.last_updated ?? Date.now()}`;
    hasSyncedInitialTimerRef.current = true;
  }, []);

  const getDuration = useCallback((m: TimerMode) => {
    if (!settings) return 0;
    switch (m) {
      case "work": return settings.workDuration * 60;
      case "shortBreak": return settings.shortBreakDuration * 60;
      case "longBreak": return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const calculateRemainingSeconds = useCallback((timer: TimerState | null, currentNowMs: number) => {
    if (!timer) return 0;

    const durationMs = timer.durationMs || getDuration(timer.mode) * 1000;
    const adjustedNowMs = currentNowMs - (timer.serverClockOffsetMs || 0);

    if (timer.isRunning && timer.startedAt) {
      return Math.max(Math.ceil((durationMs - (adjustedNowMs - timer.startedAt)) / 1000), 0);
    }

    if (timer.startedAt && timer.pausedAt) {
      return Math.max(Math.ceil((durationMs - (timer.pausedAt - timer.startedAt)) / 1000), 0);
    }

    return Math.max(Math.ceil(durationMs / 1000), 0);
  }, [getDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const validate = (newSettings: TimerSettings) => {
    const e: Record<string, string> = {};

    if (!newSettings.workDuration) {
      e.workDuration = pomodoroTimerText.errors.writeNumber;
    } else if (newSettings.workDuration < 1 || newSettings.workDuration > 900) {
      e.workDuration = pomodoroTimerText.errors.inputNumber;
    }

    if (!newSettings.shortBreakDuration) {
      e.shortBreakDuration = pomodoroTimerText.errors.writeNumber;
    } else if (newSettings.shortBreakDuration < 1 || newSettings.shortBreakDuration > 900) {
      e.shortBreakDuration = pomodoroTimerText.errors.inputNumber;
    }

    if (!newSettings.longBreakDuration) {
      e.longBreakDuration = pomodoroTimerText.errors.writeNumber;
    } else if (newSettings.longBreakDuration < 1 || newSettings.longBreakDuration > 900) {
      e.longBreakDuration = pomodoroTimerText.errors.inputNumber;
    }

    if (
      newSettings.shortBreakDuration &&
      newSettings.longBreakDuration &&
      newSettings.shortBreakDuration >= newSettings.longBreakDuration
    ) {
      e.shortBreakDuration = pomodoroTimerText.errors.shortBreakDuration;
      e.longBreakDuration = pomodoroTimerText.errors.longBreakDuration;
    }

    if (!newSettings.cyclesBeforeLongBreak) {
      e.cyclesBeforeLongBreak = pomodoroTimerText.errors.writeNumber;
    } else if (
      newSettings.cyclesBeforeLongBreak < MIN_CYCLE_BEFORE_LONG_BREAK ||
      newSettings.cyclesBeforeLongBreak > MAX_CYCLE_BEFORE_LONG_BREAK
    ) {
      e.cyclesBeforeLongBreak =
        pomodoroTimerText.errors.cyclesBeforeLongBreak(MIN_CYCLE_BEFORE_LONG_BREAK, MAX_CYCLE_BEFORE_LONG_BREAK);
    }

    return e;
  };

  const getModeInfo = () => {
    switch (mode) {
      case "work":
        return { label: pomodoroTimerText.work, icon: Brain, color: "text-sky-500" }
      case "shortBreak":
        return { label: pomodoroTimerText.shortBreak, icon: Coffee, color: "text-green-500" }
      case "longBreak":
        return { label: pomodoroTimerText.longBreak, icon: Sparkles, color: "text-yellow-500" }
    }
  };

  // ============================================================================
  // TIMER LOGIC & HANDLERS
  // ============================================================================

  const handleTimerComplete = useCallback((completedMode: TimerMode | null) => {
    if (!completedMode) return;

    if (completedMode === "work") {
      if (soundEnabled && soundEndWork.current) {
        soundEndWork.current.currentTime = 0;
        soundEndWork.current.play();
      }
    } else {
      if (soundEnabled && soundEndBreak.current) {
        soundEndBreak.current.currentTime = 0;
        soundEndBreak.current.play();
      }
    }
  }, [soundEnabled]);

  const handleStart = () => {
    if (!chatId || !settings) return;

    addEvent("start_pomodoro_timer", {
      chat_id: chatId,
      chat_type: chatType,
    });
  };

  const handlePause = () => {
    if (!chatId || !settings) return;

    addEvent("pause_pomodoro_timer", {
      chat_id: chatId,
      chat_type: chatType,
    });
  };

  const handleReset = () => {
    if (!chatId || !settings) return;

    addEvent("reset_pomodoro_timer", {
      chat_id: chatId,
      chat_type: chatType,
    });
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning || !chatId || !settings) return;

    addEvent("set_pomodoro_timer_mode", {
      chat_id: chatId,
      chat_type: chatType,
      mode: newMode,
    });
  };

  const handleChange = (field: keyof TimerSettings, value: string) => {
    if (!settings) return;

    const parsed = value === "" ? 0 : parseInt(value, 10);

    if (value !== "" && isNaN(parsed)) return;

    const newSettings = {
      ...settings,
      [field]: parsed,
    };

    setSettings(newSettings);

    const newErrors = validate(newSettings);
    setErrors(newErrors);
  };

  const handleSaveSettings = () => {
    if (!settings || !chatId || !chatType || hasErrors) return;

    setSaveState("saving");
    setSaveMessage(null);

    addEvent("update_pomodoro_plugin_config", {
      timer_id: timerId,
      chat_id: chatId,
      chat_type: chatType,
      expected_config_version: configVersion,
      config: toPayloadConfig(settings),
    });
  };

  const requestPomodoroState = useCallback(() => {
    if (!chatId || !chatType) return;

    addEvent("get_pomodoro_state", {
      chat_id: chatId,
      chat_type: chatType,
    });
  }, [addEvent, chatId, chatType]);

  const syncTimerState = useCallback((timer: TimerState | undefined) => {
    if (!timer) return;

    const completionStamp = `${timer.lastCompletedMode || "none"}:${timer.lastUpdated}`;

    setTimerSnapshot(timer);
    setMode(timer.mode);
    setIsRunning(timer.isRunning);
    setCyclesCompleted(timer.cyclesCompleted);
    setHasPendingWorkHalfCycle(timer.hasPendingWorkHalfCycle);
    setConfigVersion(timer.configVersion);

    if (timer.settings) {
      setSettings(timer.settings);
    }

    if (timer.lastCompletedMode && completionStamp !== lastCompletionStampRef.current) {
      lastCompletionStampRef.current = completionStamp;
      handleTimerComplete(timer.lastCompletedMode);
    }

    if (!hasSyncedInitialTimerRef.current) {
      hasSyncedInitialTimerRef.current = true;
    }
  }, [handleTimerComplete]);

  useEffect(() => {
    if (!timerSnapshot?.isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerSnapshot?.isRunning, timerSnapshot?.startedAt, timerSnapshot?.pausedAt, timerSnapshot?.durationMs]);

  useEffect(() => {
    if (!timerSnapshot) return;

    setTimeLeft(calculateRemainingSeconds(timerSnapshot, nowMs));
  }, [timerSnapshot, nowMs, calculateRemainingSeconds]);

  useEffect(() => {
    if (!chatId || !chatType) return;

    requestPomodoroState();
  }, [chatId, chatType, requestPomodoroState]);

  useEffect(() => {
    if (!timerSnapshot || !chatId || !chatType) return;

    if (!timerSnapshot.isRunning || timeLeft > 0) {
      return;
    }

    const resyncStamp = `${chatId}:${timerSnapshot.lastUpdated}:${timerSnapshot.mode}:${timerSnapshot.isRunning}`;

    if (lastStateResyncStampRef.current === resyncStamp) {
      return;
    }

    lastStateResyncStampRef.current = resyncStamp;
    requestPomodoroState();
  }, [chatId, chatType, requestPomodoroState, timeLeft, timerSnapshot]);

  // ============================================================================
  // EFFECTS - STORE SYNC
  // ============================================================================

  useEffect(() => {
    if (!chatId) return;

    hasSyncedInitialTimerRef.current = false;
    lastCompletionStampRef.current = "";
    lastStateResyncStampRef.current = "";

    const unsubscribe = subscribeTimer(chatId, syncTimerState);

    return unsubscribe;
  }, [chatId, syncTimerState]);

  // ============================================================================
  // EFFECTS - CONFIG LOADING
  // ============================================================================

  // Handle config loaded
  useEffect(() => {
    if (!configLoadedEvent ||
      configLoadedEvent.chat_id !== chatId ||
      configLoadedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configLoadedEvent.timer_id || "");
    setConfigVersion(configLoadedEvent.config_version ?? 0);
    const newSettings: TimerSettings = {
      workDuration: configLoadedEvent.config.work_duration,
      shortBreakDuration: configLoadedEvent.config.short_break_duration,
      longBreakDuration: configLoadedEvent.config.long_break_duration,
      cyclesBeforeLongBreak: configLoadedEvent.config.cycles_before_long_break,
    };
    setSettings(newSettings);
    applyIncomingConfig(configLoadedEvent.config);
    applyIncomingTimerState(configLoadedEvent);
    removeEvent("pomodoro_state_loaded");
  }, [configLoadedEvent, chatId, chatType, applyIncomingConfig, applyIncomingTimerState, removeEvent]);

  // Handle config updated (after save)
  useEffect(() => {
    if (!configUpdatedEvent ||
      configUpdatedEvent.chat_id !== chatId ||
      configUpdatedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configUpdatedEvent.timer_id || timerId);
    setConfigVersion(configUpdatedEvent.config_version ?? configVersion);
    const newSettings: TimerSettings = {
      workDuration: configUpdatedEvent.config.work_duration,
      shortBreakDuration: configUpdatedEvent.config.short_break_duration,
      longBreakDuration: configUpdatedEvent.config.long_break_duration,
      cyclesBeforeLongBreak: configUpdatedEvent.config.cycles_before_long_break,
    };
    setSettings(newSettings);
    applyIncomingConfig(configUpdatedEvent.config);
    applyIncomingTimerState(configUpdatedEvent);
    setSaveState("saved");
    setSaveMessage({
      type: "success",
      text: pomodoroTimerText.settingsSaved,
    });
    removeEvent("update_config");
  }, [configUpdatedEvent, chatId, chatType, timerId, applyIncomingConfig, applyIncomingTimerState, removeEvent]);

  // Handle config error
  useEffect(() => {
    if (!configErrorEvent ||
      configErrorEvent.chat_id !== chatId ||
      configErrorEvent.chat_type !== chatType) {
      return;
    }

    setSaveState("error");
    setSaveMessage({
      type: "error",
      text:
        configErrorEvent.reason === "version_conflict"
          ? pomodoroTimerText.versionConflictError
          : pomodoroTimerText.syncError,
    });
    removeEvent("pomodoro_plugin_config_error");
  }, [configErrorEvent, chatId, chatType, removeEvent]);

  // ============================================================================
  // EFFECTS - UI & FEEDBACK
  // ============================================================================

  useEffect(() => {
    if (saveState === "saved") {
      message.success({
        content: pomodoroTimerText.settingsSaved,
      });
    }

    if (saveState === "error") {
      message.error({
        content: saveMessage?.text || pomodoroTimerText.syncError,
      });
    }
  }, [saveMessage, saveState]);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasErrors = Object.keys(errors).length > 0;
  const totalDuration = (timerSnapshot?.durationMs || getDuration(mode) * 1000) / 1000;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full w-full text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 p-6">
      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-8">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 text-xs font-medium",
            isRunning && "cursor-not-allowed opacity-50",
            mode === "work"
              ? "bg-sky-100 text-sky-500 hover:bg-sky-200 border border-sky-400"
              : "text-muted-foreground hover:bg-sky-300 border border-gray-200"
          )}
          disabled={isRunning}
          onClick={() => handleModeChange("work")}
        >
          <Brain className="h-3.5 w-3.5 mr-1.5" />
          {pomodoroTimerText.work}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 text-xs font-medium",
            isRunning && "cursor-not-allowed opacity-50",
            mode === "shortBreak"
              ? "bg-green-100 text-green-600 hover:bg-green-200 border border-green-400"
              : "text-muted-foreground hover:bg-green-300 border border-gray-200"
          )}
          disabled={isRunning}
          onClick={() => handleModeChange("shortBreak")}
        >
          <Coffee className="h-3.5 w-3.5 mr-1.5" />
          {pomodoroTimerText.shortBreak}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 text-xs font-medium",
            isRunning && "cursor-not-allowed opacity-50",
            mode === "longBreak"
              ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border border-yellow-400"
              : "text-muted-foreground hover:bg-yellow-300 border border-gray-200"
          )}
          disabled={isRunning}
          onClick={() => handleModeChange("longBreak")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {pomodoroTimerText.longBreak}
        </Button>
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#dedee2"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={
              mode === "work"
                ? "#41aff4"
                : mode === "shortBreak"
                  ? "#2fd850"
                  : "#fffc4d"
            }
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
              className={cn(
                timerSnapshot?.isRunning
                  ? "transition-[stroke-dashoffset] duration-1000 ease-linear"
                  : "transition-none"
              )}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <div className={cn("flex items-center gap-2 mb-2", modeInfo.color)}>
            <ModeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{modeInfo.label}</span>
          </div>
          <span className="text-6xl font-bold text-foreground font-mono tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-slate-500 mt-2">
            {pomodoroTimerText.cycle} {cyclesCompleted + 1}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full",
            mode === "work"
              ? "hover:bg-sky-200"
              : mode === "shortBreak"
                ? "hover:bg-green-200"
                : "hover:bg-yellow-200"
          )}
          onClick={handleReset}
          aria-label="Reset timer"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className={cn(
            "h-16 w-16 rounded-full",
            mode === "work"
              ? "bg-sky-300 hover:bg-sky-200"
              : mode === "shortBreak"
                ? "bg-green-300 hover:bg-green-200"
                : "bg-yellow-300 hover:bg-yellow-200"
          )}
          onClick={isRunning ? handlePause : handleStart}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <Pause className="h-12 w-12" />
          ) : (
            <Play className="h-12 w-12" />
          )}
        </Button>

        <PomodoroSettingsPopover
          mode={mode}
          settings={settings}
          errors={errors}
          soundEnabled={soundEnabled}
          saveState={saveState}
          hasErrors={hasErrors}
          disabled={isRunning}
          onChange={handleChange}
          onToggleSound={setSoundEnabled}
          onSave={handleSaveSettings}
        />
      </div>

      {/* Completed cycles */}
      <div className="flex items-center gap-2 mt-4">
        {Array.from({ length: settings.cyclesBeforeLongBreak }).map((_, i) => {
          const remainder = cyclesCompleted % settings.cyclesBeforeLongBreak;
          const filledCount =
            remainder === 0
              ? cyclesCompleted > 0 && !hasPendingWorkHalfCycle
                ? settings.cyclesBeforeLongBreak
                : 0
              : remainder;

          const isFull = i < filledCount;
          const isHalf = hasPendingWorkHalfCycle && i === filledCount;

          return (
            <div
              key={i}
              className={cn(
                "relative h-3 w-3 rounded-full bg-gray-300 overflow-hidden",
                "transition-colors"
              )}
            >
              {(isFull || isHalf) && (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-gray-500",
                    isFull ? "w-full" : "w-1/2"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {pomodoroTimerText.cyclesCompleted(cyclesCompleted)}
      </p>
    </div>
  );
}
