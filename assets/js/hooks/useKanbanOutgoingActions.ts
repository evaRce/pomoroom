import { useEffect } from "react";
import { useEvent } from "../components/chat_room/EventContext";

type UseKanbanOutgoingActionsParams = {
  removeEvent: (eventName: string) => void;
  pushEventToLiveView: (event: string, payload: object) => any;
};

export function useKanbanOutgoingActions({
  removeEvent,
  pushEventToLiveView,
}: UseKanbanOutgoingActionsParams) {
  const getKanbanBoard = useEvent("get_kanban_board");
  const addKanbanColumn = useEvent("add_kanban_column");
  const renameKanbanColumn = useEvent("rename_kanban_column");
  const removeKanbanColumn = useEvent("remove_kanban_column");
  const addKanbanTask = useEvent("add_kanban_task");
  const moveKanbanTask = useEvent("move_kanban_task");
  const reorderKanbanTask = useEvent("reorder_kanban_task");
  const renameKanbanTask = useEvent("rename_kanban_task");
  const deleteKanbanTask = useEvent("delete_kanban_task");

  useEffect(() => {
    if (getKanbanBoard) {
      pushEventToLiveView("action.get_kanban_board", getKanbanBoard);
      removeEvent("get_kanban_board");
    }
    if (addKanbanColumn) {
      pushEventToLiveView("action.add_kanban_column", addKanbanColumn);
      removeEvent("add_kanban_column");
    }
    if (renameKanbanColumn) {
      pushEventToLiveView("action.rename_kanban_column", renameKanbanColumn);
      removeEvent("rename_kanban_column");
    }
    if (removeKanbanColumn) {
      pushEventToLiveView("action.remove_kanban_column", removeKanbanColumn);
      removeEvent("remove_kanban_column");
    }
    if (addKanbanTask) {
      pushEventToLiveView("action.add_kanban_task", addKanbanTask);
      removeEvent("add_kanban_task");
    }
    if (moveKanbanTask) {
      pushEventToLiveView("action.move_kanban_task", moveKanbanTask);
      removeEvent("move_kanban_task");
    }
    if (reorderKanbanTask) {
      pushEventToLiveView("action.reorder_kanban_task", reorderKanbanTask);
      removeEvent("reorder_kanban_task");
    }
    if (renameKanbanTask) {
      pushEventToLiveView("action.rename_kanban_task", renameKanbanTask);
      removeEvent("rename_kanban_task");
    }
    if (deleteKanbanTask) {
      pushEventToLiveView("action.delete_kanban_task", deleteKanbanTask);
      removeEvent("delete_kanban_task");
    }
  }, [
    getKanbanBoard,
    addKanbanColumn,
    renameKanbanColumn,
    removeKanbanColumn,
    addKanbanTask,
    moveKanbanTask,
    reorderKanbanTask,
    renameKanbanTask,
    deleteKanbanTask,
    pushEventToLiveView,
    removeEvent,
  ]);
}
