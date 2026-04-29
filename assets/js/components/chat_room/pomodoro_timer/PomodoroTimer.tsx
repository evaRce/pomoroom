import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Coffee,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "../../../../components-shadcn/ui/button";
import { Input } from "../../../../components-shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components-shadcn/ui/popover";
import { cn } from "../../../../lib/utils";
import { Switch } from "antd";
import pomodoroTimerText from "./pomodoroTimerText";
import { useEventContext, useEvent } from "../EventContext";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
}

interface PomodoroTimerProps {
  chatId: string;
  chatType: "private" | "group";
}

const MIN_CYCLE_BEFORE_LONG_BREAK = 2;
const MAX_CYCLE_BEFORE_LONG_BREAK = 10;

export function PomodoroTimer({ chatId, chatType }: PomodoroTimerProps) {
  const { addEvent, removeEvent } = useEventContext() as any;
  const [settings, setSettings] = useState<TimerSettings | null>(null);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [hasPendingWorkHalfCycle, setHasPendingWorkHalfCycle] = useState(false);
  const [timerId, setTimerId] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const completionHandledRef = useRef(false);
  const configRequestedRef = useRef(false);
  const soundEndWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const soundEndBreak = useRef(new Audio("/sounds/happy-bells-notification.wav"));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const configLoadedEvent = useEvent("pomodoro_plugin_config_loaded");
  const configUpdatedEvent = useEvent("pomodoro_plugin_config_updated");
  const configErrorEvent = useEvent("pomodoro_plugin_config_error");

  // ====================== CONFIG ======================

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

  // Load config on mount
  useEffect(() => {
    if (!chatId || !chatType || configRequestedRef.current) {
      return;
    }

    configRequestedRef.current = true;
    addEvent("get_pomodoro_plugin_config", {
      chat_id: chatId,
      chat_type: chatType,
    });
  }, [addEvent, chatId, chatType]);

  useEffect(() => {
    if (!configLoadedEvent ||
      configLoadedEvent.chat_id !== chatId ||
      configLoadedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configLoadedEvent.timer_id || "");
    applyIncomingConfig(configLoadedEvent.config);
    removeEvent("pomodoro_plugin_config_loaded");
  }, [configLoadedEvent, chatId, chatType, applyIncomingConfig, removeEvent]);

  // Updated config (after save)
  useEffect(() => {
    if (!configUpdatedEvent ||
      configUpdatedEvent.chat_id !== chatId ||
      configUpdatedEvent.chat_type !== chatType) {
      return;
    }

    setTimerId(configUpdatedEvent.timer_id || timerId);
    applyIncomingConfig(configUpdatedEvent.config);
    setSaveState("saved");
    setSaveMessage({
      type: "success",
      text: pomodoroTimerText.settingsSaved,
    });
    removeEvent("pomodoro_plugin_config_updated");
  }, [configUpdatedEvent, chatId, chatType, timerId, applyIncomingConfig, removeEvent]);

  useEffect(() => {
    if (!configErrorEvent ||
      configErrorEvent.chat_id !== chatId ||
      configErrorEvent.chat_type !== chatType) {
      return;
    }

    setSaveState("idle");
    setSaveMessage({
      type: "error",
      text: pomodoroTimerText.syncError,
    });
    removeEvent("pomodoro_plugin_config_error");
  }, [configErrorEvent, chatId, chatType, removeEvent]);

  useEffect(() => {
    if (saveState === "saved") {
      const timer = setTimeout(() => {
        setSaveState("idle");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  // ====================== TIMER LOGIC ======================

  const getDuration = useCallback((m: TimerMode) => {
    if (!settings) return 0;

    switch (m) {
      case "work": return settings.workDuration * 60;
      case "shortBreak": return settings.shortBreakDuration * 60;
      case "longBreak": return settings.longBreakDuration * 60;
    }
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    completionHandledRef.current = false;
    setTimeLeft(getDuration(mode));
  }, [mode, settings, getDuration]);

  const handleTimerComplete = useCallback(() => {
    if (!settings) return;

    if (mode === "work") {
      if (soundEnabled && soundEndWork.current) {
        soundEndWork.current.currentTime = 0;
        soundEndWork.current.play();
      }
      setHasPendingWorkHalfCycle(true)
      const cyclesAfterBreak = cyclesCompleted + 1;
      if (cyclesAfterBreak % settings.cyclesBeforeLongBreak === 0) {
        setMode("longBreak");
      } else {
        setMode("shortBreak");
      }
    } else {
      if (soundEnabled && soundEndBreak.current) {
        soundEndBreak.current.currentTime = 0;
        soundEndBreak.current.play();
      }
      setCyclesCompleted((prev) => prev + 1);
      setHasPendingWorkHalfCycle(false);
      setMode("work");
    }
  }, [mode, cyclesCompleted, settings, soundEnabled]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || timeLeft !== 0 || completionHandledRef.current) return;

    completionHandledRef.current = true;
    setIsRunning(false);
    handleTimerComplete();
  }, [isRunning, timeLeft, handleTimerComplete]);

  // ====================== HANDLERS ======================

  const handleStart = () => {
    completionHandledRef.current = false;
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    completionHandledRef.current = false;
    setHasPendingWorkHalfCycle(false);
    setTimeLeft(getDuration(mode));
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    completionHandledRef.current = false;
    setHasPendingWorkHalfCycle(false);
    setMode(newMode);
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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ====================== SETTINGS HANDLING ======================

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

  const hasErrors = Object.keys(errors).length > 0;

  const totalDuration = getDuration(mode);
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

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

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [saveMessage]);


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
            mode === "work"
              ? "bg-sky-100 text-sky-500 hover:bg-sky-200 border border-sky-400"
              : "text-muted-foreground hover:bg-sky-300 border border-gray-200"
          )}
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
            mode === "shortBreak"
              ? "bg-green-100 text-green-600 hover:bg-green-200 border border-green-400"
              : "text-muted-foreground hover:bg-green-300 border border-gray-200"
          )}
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
            mode === "longBreak"
              ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border border-yellow-400"
              : "text-muted-foreground hover:bg-yellow-300 border border-gray-200"
          )}
          onClick={() => handleModeChange("longBreak")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {pomodoroTimerText.longBreak}
        </Button>
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Progress ring */}
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#dedee2" // gray-600
            strokeWidth="8"
          />
          {/* Progress circle */}
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

        {/* Time display */}
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

        <Popover>
          <PopoverTrigger asChild>
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
              aria-label="Timer settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>

          {/* Timer settings content */}
          <PopoverContent className="w-72 bg-gray-100" align="center">
            <div className="flex flex-col gap-4">
              <h4 className="text-base font-semibold text-slate-900">
                {pomodoroTimerText.timerSettings}
              </h4>

              <div className="flex flex-col gap-4">

                {/* Work */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-slate-700">
                      {pomodoroTimerText.workMinutes}
                    </label>

                    <Input
                      type="number"
                      min={1}
                      max={900}
                      value={settings.workDuration}
                      onChange={(e) =>
                        handleChange("workDuration", e.target.value)
                      }
                      className="w-20 h-8 text-sm text-center focus:border-blue-400"
                    />
                  </div>

                  {errors.workDuration && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {errors.workDuration}
                    </p>
                  )}
                </div>

                {/* Short break */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-slate-700">
                      {pomodoroTimerText.shortBreakMinutes}
                    </label>

                    <Input
                      type="number"
                      min={1}
                      max={900}
                      value={settings.shortBreakDuration}
                      onChange={(e) =>
                        handleChange("shortBreakDuration", e.target.value)
                      }
                      className="w-20 h-8 text-sm text-center focus:border-blue-400"
                    />
                  </div>

                  {errors.shortBreakDuration && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {errors.shortBreakDuration}
                    </p>
                  )}
                </div>

                {/* Long break */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm text-slate-700">
                      {pomodoroTimerText.longBreakMinutes}
                    </label>

                    <Input
                      type="number"
                      min={1}
                      max={900}
                      value={settings.longBreakDuration}
                      onChange={(e) =>
                        handleChange("longBreakDuration", e.target.value)
                      }
                      className="w-20 h-8 text-sm text-center focus:border-blue-400"
                    />
                  </div>

                  {errors.longBreakDuration && (
                    <p className="text-xs text-red-500 mt-1 pl-1">
                      {errors.longBreakDuration}
                    </p>
                  )}
                </div>

                {/* Cycles before long break */}
                <div className="flex flex-col gap-1"></div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-700">
                    {pomodoroTimerText.cyclesBeforeLongBreak}
                  </label>

                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={settings.cyclesBeforeLongBreak}
                    onChange={(e) =>
                      handleChange("cyclesBeforeLongBreak", e.target.value)
                    }
                    className="w-20 h-8 text-sm text-center focus:border-blue-400"
                  />
                </div>
                {errors.cyclesBeforeLongBreak && (
                  <p className="text-xs text-red-500 mt-1 pl-1">
                    {errors.cyclesBeforeLongBreak}
                  </p>
                )}
              </div>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between mt-2">
              <label className="text-sm text-slate-700">
                {pomodoroTimerText.soundEndPeriod}
              </label>

              <Switch
                className="bg-gray-500"
                checked={soundEnabled}
                onChange={setSoundEnabled}
              />
            </div>

            {/* Save settings */}
            <div className="mt-3 flex items-center justify-end gap-3">
              {saveState === "saved" && (
                <span className="text-xs text-green-600">
                  {pomodoroTimerText.settingsSaved}
                </span>
              )}

              <Button
                size="sm"
                className="h-8 bg-sky-400 hover:bg-sky-600 text-stone-700"
                onClick={handleSaveSettings}
                disabled={saveState === "saving" || hasErrors}
              >
                {pomodoroTimerText.saveSettings}
              </Button>
            </div>

            {saveMessage && (
              <div className={cn(
                "text-xs p-2 rounded-md border",
                saveMessage.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              )}>
                {saveMessage.text}
              </div>
            )}
          </PopoverContent>
        </Popover >
      </div >

      {/* Completed cycles */}
      < div className="flex items-center gap-2" >
        {
          Array.from({ length: settings.cyclesBeforeLongBreak }).map((_, i) => {
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
          })
        }
      </div >
      <p className="text-xs text-slate-500 mt-2">
        {pomodoroTimerText.cyclesCompleted(cyclesCompleted)}
      </p>
    </div >
  );
}
