const pomodoroTimerText = {
  work: "Trabajo",
  shortBreak: "Descanso corto",
  longBreak: "Descanso largo",
  timerSettings: "Configuración del temporizador",
  workMinutes: "Trabajo (minutos)",
  shortBreakMinutes: "Descanso corto (minutos)",
  longBreakMinutes: "Descanso largo (minutos)",
  cyclesBeforeLongBreak: "Ciclos antes de descanso largo",
  soundEndPeriod: "Sonido fin de periodo",
  cycle: "Ciclo",
  cyclesCompleted: (count: number) => `${count} ${count === 1 ? "ciclo completado" : "ciclos completados"} hoy`,
  alertShortVsLong: "El tiempo de `descanso corto` debe ser menor que el tiempo de `descanso largo`.",
};

export default pomodoroTimerText;
