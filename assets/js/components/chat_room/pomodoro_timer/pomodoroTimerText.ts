import { InputNumber } from "antd";

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
  saveSettings: "Guardar configuración",
  settingsSaved: "Configuración guardada",
  syncError: "Error al guardar la configuración. Por favor, inténtalo de nuevo.",
  cycle: "Ciclo",
  cyclesCompleted: (count: number) => `${count} ${count === 1 ? "ciclo completado" : "ciclos completados"} hoy`,
  errors: {
    shortBreakDuration: "Debe ser menor que el descanso largo",
    longBreakDuration: "Debe ser mayor que el descanso corto",
    writeNumber: "Escribe un número",
    inputNumber: "Debe ser un número",
    cyclesBeforeLongBreak: (min: number, max: number) => `Debe ser un número entre ${min} y ${max}`,
  },
  alertShortVsLong: "El tiempo de `descanso corto` debe ser menor que el tiempo de `descanso largo`.",
};

export default pomodoroTimerText;
