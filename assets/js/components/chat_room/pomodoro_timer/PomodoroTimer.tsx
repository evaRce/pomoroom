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

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
}

export function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [hasPendingWorkHalfCycle, setHasPendingWorkHalfCycle] = useState(false);
  const completionHandledRef = useRef(false);
  const soundEndWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const soundEndBreak = useRef(new Audio("/sounds/happy-bells-notification.wav"));
  const [soundEnabled, setSoundEnabled] = useState(true);

  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case "work":
        return settings.workDuration * 60
      case "shortBreak":
        return settings.shortBreakDuration * 60
      case "longBreak":
        return settings.longBreakDuration * 60
    }
  }, [settings]);

  useEffect(() => {
    completionHandledRef.current = false
    setTimeLeft(getDuration(mode))
  }, [mode, getDuration]);

  const handleTimerComplete = useCallback(() => {
    if (mode === "work") {
      if (soundEnabled && soundEndWork.current) {
        soundEndWork.current.currentTime = 0;
        soundEndWork.current.play();
      }
      setHasPendingWorkHalfCycle(true)
      const cyclesAfterBreak = cyclesCompleted + 1
      if (cyclesAfterBreak % settings.cyclesBeforeLongBreak === 0) {
        setMode("longBreak")
      } else {
        setMode("shortBreak")
      }
    } else {
      if (soundEnabled && soundEndBreak.current) {
        soundEndBreak.current.currentTime = 0;
        soundEndBreak.current.play();
      }
      setCyclesCompleted((prev) => prev + 1)
      setHasPendingWorkHalfCycle(false)
      setMode("work")
    }
  }, [mode, cyclesCompleted, settings.cyclesBeforeLongBreak, soundEnabled]);

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || timeLeft !== 0 || completionHandledRef.current) return

    completionHandledRef.current = true
    setIsRunning(false)
    handleTimerComplete()
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleStart = () => {
    completionHandledRef.current = false
    setIsRunning(true)
  };
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false)
    completionHandledRef.current = false
    setHasPendingWorkHalfCycle(false)
    setTimeLeft(getDuration(mode))
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false)
    completionHandledRef.current = false
    setHasPendingWorkHalfCycle(false)
    setMode(newMode)
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  };

  const totalDuration = getDuration(mode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const getModeInfo = () => {
    switch (mode) {
      case "work":
        return { label: "Trabajo", icon: Brain, color: "text-sky-500" }
      case "shortBreak":
        return { label: "Descanso corto", icon: Coffee, color: "text-green-500" }
      case "longBreak":
        return { label: "Descanso largo", icon: Sparkles, color: "text-yellow-500" }
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  const validateLongBreak = (newLongBreak: number, shortBreak: number) => {
    if (newLongBreak <= shortBreak) {
      alert(
        "El tiempo de `descanso corto` debe ser menor que el tiempo de `descanso largo`."
      );
      return false;
    }
    return true;
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
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
          Trabajo
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
          Descanso corto
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
          Descanso largo
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
            Ciclo {cyclesCompleted + 1}
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
                Configuración del temporizador
              </h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">
                    Trabajo (minutos)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.workDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workDuration: parseInt(e.target.value) || 25,
                      }))
                    }
                    className="w-20 h-8 text-sm text-center focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">
                    Descanso corto (minutos)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.shortBreakDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shortBreakDuration: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="w-20 h-8 text-sm text-center focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">
                    Descanso largo (minutos)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.longBreakDuration}
                    onChange={(e) => {
                      const newLongBreak = parseInt(e.target.value) || 15;
                      if (validateLongBreak(newLongBreak, settings.shortBreakDuration)) {
                        setSettings((prev) => ({
                          ...prev,
                          longBreakDuration: newLongBreak,
                        }));
                      }
                    }}
                    className="w-20 h-8 text-sm text-center focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700">
                    Ciclos antes de descanso largo
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.cyclesBeforeLongBreak}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        cyclesBeforeLongBreak: parseInt(e.target.value) || 4,
                      }))
                    }
                    className="w-20 h-8 text-sm text-center focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="text-sm text-slate-700">
                    Sonido fin de periodo
                  </label>
                  <Switch className="bg-gray-500" checked={soundEnabled} onChange={setSoundEnabled} />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Completed cycles */}
      <div className="flex items-center gap-2">
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
        {cyclesCompleted} {cyclesCompleted === 1 ? "ciclo completado" : "ciclos completados"} hoy
      </p>
    </div>
  )
}
