import { useTranslation } from "react-i18next";

export function useKanbanText() {
  const { t } = useTranslation();

  return {
    task: {
      delete: {
        title: t("kanbanText.taskDeleteTitle"),
        confirmMessage: t("kanbanText.taskDeleteConfirmMessage"),
        irreversibleWarning: t("kanbanText.taskDeleteIrreversibleWarning"),
        okButton: t("kanbanText.taskDeleteOkButton"),
      },
      editButton: t("kanbanText.taskEditButton"),
      addButton: t("kanbanText.taskAddButton"),
      saveButton: t("kanbanText.taskSaveButton"),
      inputPlaceholder: t("kanbanText.taskInputPlaceholder"),
      emptyListMessage: t("kanbanText.taskEmptyListMessage"),
      limitReached: {
        title: (max: number) => t("kanbanText.taskLimitReachedTitle", { max }),
        content: (max: number) => t("kanbanText.taskLimitReachedContent", { max }),
      },
      cancelButton: t("kanbanText.taskCancelButton"),
      understood: t("kanbanText.taskUnderstood"),
    },

    column: {
      delete: {
        title: t("kanbanText.columnDeleteTitle"),
        confirmMessage: (colTitle: string, hasTasks: boolean) =>
          hasTasks
            ? t("kanbanText.columnDeleteConfirmMessageWithTasks", { colTitle })
            : t("kanbanText.columnDeleteConfirmMessageNoTasks", { colTitle }),
        irreversibleWarning: (hasTasks: boolean) =>
          hasTasks
            ? t("kanbanText.columnDeleteIrreversibleWarningWithTasks")
            : t("kanbanText.columnDeleteIrreversibleWarningNoTasks"),
        okButton: t("kanbanText.columnDeleteOkButton"),
      },
      rename: {
        button: t("kanbanText.columnRenameButton"),
        prompt: t("kanbanText.columnRenamePrompt"),
      },
      add: {
        button: t("kanbanText.columnAddButton"),
        inputPlaceholder: t("kanbanText.columnAddInputPlaceholder"),
        taskLabel: (colTitle: string) => t("kanbanText.columnAddTaskLabel", { colTitle }),
      },
      limitReachedMessage: (max: number) => t("kanbanText.columnLimitReachedMessage", { max }),
      cancelButton: t("kanbanText.columnCancelButton"),
      createButton: t("kanbanText.columnCreateButton"),
    },
  };
}
