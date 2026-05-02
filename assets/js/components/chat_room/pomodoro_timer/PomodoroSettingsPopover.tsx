import React from "react";
import { Settings } from "lucide-react";
import { Switch } from "antd";
import { Button } from "../../../../components-shadcn/ui/button";
import { Input } from "../../../../components-shadcn/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components-shadcn/ui/popover";
import { cn } from "../../../../lib/utils";
import pomodoroTimerText from "./pomodoroTimerText";
export type TimerMode = "work" | "shortBreak" | "longBreak";

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export const MIN_CYCLE_BEFORE_LONG_BREAK = 2;
export const MAX_CYCLE_BEFORE_LONG_BREAK = 10;

interface SaveMessage {
  type: "success" | "error";
  text: string;
}

interface PomodoroSettingsPopoverProps {
  mode: TimerMode;
  settings: TimerSettings;
  errors: Record<string, string>;
  soundEnabled: boolean;
  saveState: SaveState;
  hasErrors: boolean;
  disabled?: boolean;
  onChange: (field: keyof TimerSettings, value: string) => void;
  onToggleSound: (checked: boolean) => void;
  onSave: () => void;
}

export function PomodoroSettingsPopover({
  mode,
  settings,
  errors,
  soundEnabled,
  saveState,
  hasErrors,
  disabled,
  onChange,
  onToggleSound,
  onSave,
}: PomodoroSettingsPopoverProps) {
  return (
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
          disabled={disabled}
          aria-label="Timer settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 bg-gray-100" align="center">
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold text-slate-900">
            {pomodoroTimerText.timerSettings}
          </h4>

          <div className="flex flex-col gap-4">
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
                  onChange={(e) => onChange("workDuration", e.target.value)}
                  className="w-20 h-8 text-sm text-center focus:border-blue-400"
                />
              </div>
              {errors.workDuration && (
                <p className="text-xs text-red-500 mt-1 pl-1">
                  {errors.workDuration}
                </p>
              )}
            </div>

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
                  onChange={(e) => onChange("shortBreakDuration", e.target.value)}
                  className="w-20 h-8 text-sm text-center focus:border-blue-400"
                />
              </div>
              {errors.shortBreakDuration && (
                <p className="text-xs text-red-500 mt-1 pl-1">
                  {errors.shortBreakDuration}
                </p>
              )}
            </div>

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
                  onChange={(e) => onChange("longBreakDuration", e.target.value)}
                  className="w-20 h-8 text-sm text-center focus:border-blue-400"
                />
              </div>
              {errors.longBreakDuration && (
                <p className="text-xs text-red-500 mt-1 pl-1">
                  {errors.longBreakDuration}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-700">
                  {pomodoroTimerText.cyclesBeforeLongBreak}
                </label>
                <Input
                  type="number"
                  min={MIN_CYCLE_BEFORE_LONG_BREAK}
                  max={MAX_CYCLE_BEFORE_LONG_BREAK}
                  value={settings.cyclesBeforeLongBreak}
                  onChange={(e) => onChange("cyclesBeforeLongBreak", e.target.value)}
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

          <div className="flex items-center justify-between mt-2">
            <label className="text-sm text-slate-700">
              {pomodoroTimerText.soundEndPeriod}
            </label>
            <Switch
              className="bg-gray-500"
              checked={soundEnabled}
              onChange={onToggleSound}
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-3">
            <Button
              size="sm"
              className="h-8 bg-sky-400 hover:bg-sky-600 text-stone-700"
              onClick={onSave}
              disabled={saveState === "saving" || hasErrors}
            >
              {pomodoroTimerText.saveSettings}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
