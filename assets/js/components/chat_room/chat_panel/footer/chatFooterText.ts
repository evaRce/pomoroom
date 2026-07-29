const chatFooterText = {
  removedFromGroup: (groupName?: string) =>
    groupName ? `Has sido eliminado del grupo ${groupName}` : "Has sido eliminado del grupo",
  warningIconLabel: "warning",
  inputPlaceholder: "Escribe un mensaje",
  emojiButton: "Elegir emoji",
  sendMessageButton: "Enviar mensaje",
  characterLimitModal: {
    title: "Límite de caracteres excedido",
    message: "Se ha excedido el límite de 5000 caracteres.",
  },
};

export default chatFooterText;
