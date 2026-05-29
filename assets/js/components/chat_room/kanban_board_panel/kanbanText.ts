export const KANBAN_TEXT = {
  task: {
    delete: {
      title: "Eliminar tarea",
      confirmMessage: "¿Deseas eliminar esta tarea?",
      irreversibleWarning: "Esta acción es irreversible y no se podrá recuperar la tarea eliminada.",
      okButton: "Eliminar",
    },
    editButton: "Editar",
    addButton: "Agregar tarea",
    inputPlaceholder: "Título de la tarea...",
    emptyListMessage: "No hay tareas todavía",
    limitReached: {
      title: (max: number) => `Límite de ${max} tareas por columna`,
      content: (max: number) => `No puedes añadir más de ${max} tareas en esta columna.`,
    },
    cancelButton: "Cancelar",
  },

  column: {
    delete: {
      title: "Eliminar columna",
      confirmMessage: (colTitle: string, hasTasks: boolean) => 
        hasTasks
          ? `¿Deseas eliminar la columna "${colTitle}" y todas sus tareas?`
          : `¿Deseas eliminar la columna "${colTitle}"?`,
      irreversibleWarning: (hasTasks: boolean) =>
        hasTasks
          ? "Esta acción es irreversible y no se podrá recuperar la columna ni sus tareas"
          : "Esta acción es irreversible y no se podrá recuperar la columna",
      okButton: "Eliminar",
    },
    rename: {
      button: "Renombrar columna",
      prompt: "Nuevo nombre de la columna:",
    },
    add: {
      button: "Agregar columna",
      inputPlaceholder: "Nombre de la columna...",
      taskLabel: (colTitle: string) => `Agregar tarea a ${colTitle}`,
    },
    limitReachedMessage: (max: number) => `Límite de ${max} columnas alcanzado`,
    optionsLabel: (colTitle: string) => `Opciones de columna para ${colTitle}`,
    cancelButton: "Cancelar",
    createButton: "Crear",
  },
};

