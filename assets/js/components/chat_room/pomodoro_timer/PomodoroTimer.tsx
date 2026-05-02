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
  getTimer,
  createTimer,
  updateTimer,
  hasTimer,
  deleteTimer,
  hasRequestedConfig,
  markConfigRequested,
  startTimerEngine,
  subscribeTimer,
  createInitialTimerState,
  getSnapshotForMode,
  type TimerState,
} from "./pomodoroTimerStore";

interface PomodoroTimerProps {
  chatId: string;
  chatType: "private" | "group";
}

export function PomodoroTimer({ chatId, chatType }: PomodoroTimerProps) {
  const { addEvent, removeEvent } = useEventContext() as any;
  const [settings, setSettings] = useState<TimerSettings | null>(null);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [hasPendingWorkHalfCycle, setHasPendingWorkHalfCycle] = useState(false);
  const [timerId, setTimerId] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs
  const hasSyncedInitialTimerRef = useRef(false);
  const lastCompletionVersionRef = useRef(0);
  const soundEndWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const soundEndBreak = useRef(new Audio("/sounds/happy-bells-notification.wav"));

  // Events
  const configLoadedEvent = useEvent("pomodoro_plugin_config_loaded");
  const configUpdatedEvent = useEvent("pomodoro_plugin_config_updated");
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

  const getDuration = useCallback((m: TimerMode) => {
    if (!settings) return 0;
    switch (m) {
      case "work": return settings.workDuration * 60;
      case "shortBreak": return settings.shortBreakDuration * 60;
      case "longBreak": return settings.longBreakDuration * 60;
    }
  }, [settings]);

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
    setIsRunning(true);
    if (chatId && settings) {
      updateTimer(chatId, { isRunning: true });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (chatId && settings) {
      updateTimer(chatId, {
        isRunning: false,
        mode,
        timeLeft,
      });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const resetTimeLeft = getDuration(mode);
    setHasPendingWorkHalfCycle(false);
    setTimeLeft(resetTimeLeft);
    if (chatId && settings) {
      updateTimer(chatId, {
        isRunning: false,
        hasPendingWorkHalfCycle: false,
        mode,
        timeLeft: resetTimeLeft,
      });
    }
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning) return;

    setIsRunning(false);
    const nextTimeLeft = chatId ? getSnapshotForMode(chatId, newMode) : getDuration(newMode);
    setHasPendingWorkHalfCycle(false);
    setMode(newMode);
    setTimeLeft(nextTimeLeft);
    if (chatId && settings) {
      updateTimer(chatId, {
        mode: newMode,
        isRunning: false,
        hasPendingWorkHalfCycle: false,
        timeLeft: nextTimeLeft,
      });
    }
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
      config: toPayloadConfig(settings),
    });

    if (chatId && settings) {
      updateTimer(chatId, createInitialTimerState(settings));
      }
  };

  const syncTimerState = useCallback((timer: TimerState | undefined) => {
    if (!timer) return;

    setMode(timer.mode);
    setTimeLeft(timer.timeLeft);
    setIsRunning(timer.isRunning);
    setCyclesCompleted(timer.cyclesCompleted);
    setHasPendingWorkHalfCycle(timer.hasPendingWorkHalfCycle);

    if (timer.settings) {
      setSettings(timer.settings);
    }

    if (!hasSyncedInitialTimerRef.current) {
      hasSyncedInitialTimerRef.current = true;
      lastCompletionVersionRef.current = timer.completionVersion;
      return;
    }

    if (timer.completionVersion > lastCompletionVersionRef.current) {
      lastCompletionVersionRef.current = timer.completionVersion;
      handleTimerComplete(timer.lastCompletedMode);
    }
  }, [handleTimerComplete]);

  // ============================================================================
  // EFFECTS - STORE SYNC
  // ============================================================================

  useEffect(() => {
    startTimerEngine();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    hasSyncedInitialTimerRef.current = false;

    const unsubscribe = subscribeTimer(chatId, syncTimerState);
    const storedTimer = getTimer(chatId);

    if (storedTimer) {
      syncTimerState(storedTimer);
    }

    return unsubscribe;
  }, [chatId, syncTimerState]);

  // Restore timer state from store when chatId changes
  useEffect(() => {
    if (!chatId || !settings) return;

    if (!hasTimer(chatId)) {
      createTimer(chatId, createInitialTimerState(settings));
    }
  }, [chatId, settings]);

  // ============================================================================
  // EFFECTS - CONFIG LOADING
  // ============================================================================

  // Load config on mount
  useEffect(() => {
    if (!chatId || !chatType) return;

    if (hasRequestedConfig(chatId)) return;

    markConfigRequested(chatId);

    addEvent("get_pomodoro_plugin_config", {
      chat_id: chatId,
      chat_type: chatType,
    });
  }, [chatId, chatType]);

  // Handle config loaded
  useEffect(() => {
    if (!configLoadedEvent ||
      configLoadedEvent.chat_id !== chatId ||
      configLoadedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configLoadedEvent.timer_id || "");
    const newSettings: TimerSettings = {
      workDuration: configLoadedEvent.config.work_duration,
      shortBreakDuration: configLoadedEvent.config.short_break_duration,
      longBreakDuration: configLoadedEvent.config.long_break_duration,
      cyclesBeforeLongBreak: configLoadedEvent.config.cycles_before_long_break,
    };
    setSettings(newSettings);
    applyIncomingConfig(configLoadedEvent.config);

    // Update store if timer already exists
    if (chatId && hasTimer(chatId)) {
      updateTimer(chatId, { settings: newSettings });
    }

    removeEvent("pomodoro_plugin_config_loaded");
  }, [configLoadedEvent, chatId, chatType, applyIncomingConfig, removeEvent]);

  // Handle config updated (after save)
  useEffect(() => {
    if (!configUpdatedEvent ||
      configUpdatedEvent.chat_id !== chatId ||
      configUpdatedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configUpdatedEvent.timer_id || timerId);
    const newSettings: TimerSettings = {
      workDuration: configUpdatedEvent.config.work_duration,
      shortBreakDuration: configUpdatedEvent.config.short_break_duration,
      longBreakDuration: configUpdatedEvent.config.long_break_duration,
      cyclesBeforeLongBreak: configUpdatedEvent.config.cycles_before_long_break,
    };
    setSettings(newSettings);
    applyIncomingConfig(configUpdatedEvent.config);

    // Update store if timer exists
    if (chatId && hasTimer(chatId)) {
      try {
        deleteTimer(chatId);
      } catch (e) {
        // ignore
      }
      createTimer(chatId, createInitialTimerState(newSettings));
    }

    setSaveState("saved");
    setSaveMessage({
      type: "success",
      text: pomodoroTimerText.settingsSaved,
    });
    removeEvent("pomodoro_plugin_config_updated");
  }, [configUpdatedEvent, chatId, chatType, timerId, applyIncomingConfig, removeEvent]);

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
      text: pomodoroTimerText.syncError,
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
        content: pomodoroTimerText.syncError,
      });
    }
  }, [saveState]);

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
  const totalDuration = getDuration(mode);
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
            className="transition-all duration-1000 ease-linear"
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
