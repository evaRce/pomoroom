import { useTranslation } from "react-i18next";

export default function usePomodoroTimerText() {
  const { t } = useTranslation();

  return {
    work: t("pomodoroTimerText.work"),
    shortBreak: t("pomodoroTimerText.shortBreak"),
    longBreak: t("pomodoroTimerText.longBreak"),
    timerSettings: t("pomodoroTimerText.timerSettings"),
    workMinutes: t("pomodoroTimerText.workMinutes"),
    shortBreakMinutes: t("pomodoroTimerText.shortBreakMinutes"),
    longBreakMinutes: t("pomodoroTimerText.longBreakMinutes"),
    cyclesBeforeLongBreak: t("pomodoroTimerText.cyclesBeforeLongBreak"),
    soundEndPeriod: t("pomodoroTimerText.soundEndPeriod"),
    saveSettings: t("pomodoroTimerText.saveSettings"),
    settingsSaved: t("pomodoroTimerText.settingsSaved"),
    syncError: t("pomodoroTimerText.syncError"),
    cycle: t("pomodoroTimerText.cycle"),
    cyclesCompleted: (count: number) => t("pomodoroTimerText.cyclesCompleted", { count }),
    sessionTime: t("pomodoroTimerText.sessionTime"),
    errors: {
      shortBreakDuration: t("pomodoroTimerText.errorShortBreakDuration"),
      longBreakDuration: t("pomodoroTimerText.errorLongBreakDuration"),
      writeNumber: t("pomodoroTimerText.errorWriteNumber"),
      inputNumber: t("pomodoroTimerText.errorInputNumber"),
      cyclesBeforeLongBreak: (min: number, max: number) =>
        t("pomodoroTimerText.errorCyclesBeforeLongBreak", { min, max }),
    },
    alertShortVsLong: t("pomodoroTimerText.alertShortVsLong"),
    workTimerEnded: t("pomodoroTimerText.workTimerEnded"),
    shortBreakTimerEnded: t("pomodoroTimerText.shortBreakTimerEnded"),
    longBreakTimerEnded: t("pomodoroTimerText.longBreakTimerEnded"),
    loadingSettings: t("pomodoroTimerText.loadingSettings"),
  };
}
