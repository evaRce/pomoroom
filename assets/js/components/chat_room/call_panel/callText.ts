const callText = {
  button: {
    showRoom: "Mostrar sala",
    anotherCallActive: "Ya estás en otra llamada",
    joinRoom: "Entrar a la sala",
    connecting: "Conectando...",
  },

  connection: {
    joinNotAllowed: "No se pudo entrar a la llamada: acceso no autorizado.",
    joinUnreachable:
      "No se pudo contactar con el servidor de llamadas. Revisa tu conexión a internet e inténtalo de nuevo.",
    joinFailed: "No se pudo conectar a la llamada. Inténtalo de nuevo.",
    callDropped: "Se perdió la conexión con la llamada.",
  },

  screen: {
    roomTitle: (roomName: string) => (roomName ? `Sala con ${roomName}` : "Sala de llamada"),
    participantsCount: (count: number) => `${count} participante${count === 1 ? "" : "s"}`,
    you: "Tú",
    muteMic: "Silenciar micrófono",
    unmuteMic: "Activar micrófono",
    turnOffCamera: "Apagar cámara",
    turnOnCamera: "Encender cámara",
    switchCamera: "Cambiar de cámara",
    startScreenShare: "Compartir pantalla",
    stopScreenShare: "Dejar de compartir pantalla",
    screenShareBlocked:
      "Otro usuario está compartiendo pantalla actualmente. Debe dejar de compartir para que puedas hacerlo tú",
    screenShareConflict:
      "Otro participante ha empezado a compartir pantalla justo antes que tú. Se ha detenido tu recurso compartido.",
    screenShareFailed: "No se pudo compartir la pantalla. Inténtalo de nuevo.",
    endCall: "Finalizar llamada",
    enterFullscreen: "Pantalla completa",
    exitFullscreen: "Salir de pantalla completa",
    close: "Cerrar",
    overflowUnit: (count: number) => `usuario${count === 1 ? "" : "s"}`,
  },

  minibar: {
    callInProgress: "En llamada",
  },
};

export default callText;
