type AddEvent = (eventName: string, eventData: any) => void;
type ChatType = "group" | "private";

export function requestKanbanBoardAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType
): void {
  addEvent("get_kanban_board", { chat_id: chatId, chat_type: chatType });
}

export function addKanbanColumnAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  title: string
): void {
  addEvent("add_kanban_column", { chat_id: chatId, chat_type: chatType, title });
}

export function renameKanbanColumnAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  columnId: string,
  title: string
): void {
  addEvent("rename_kanban_column", {
    chat_id: chatId,
    chat_type: chatType,
    column_id: columnId,
    title,
  });
}

export function removeKanbanColumnAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  columnId: string
): void {
  addEvent("remove_kanban_column", {
    chat_id: chatId,
    chat_type: chatType,
    column_id: columnId,
  });
}

export function addKanbanTaskAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  columnId: string,
  title: string
): void {
  addEvent("add_kanban_task", {
    chat_id: chatId,
    chat_type: chatType,
    column_id: columnId,
    title,
  });
}

export function renameKanbanTaskAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  taskId: string,
  title: string
): void {
  addEvent("rename_kanban_task", {
    chat_id: chatId,
    chat_type: chatType,
    task_id: taskId,
    title,
  });
}

export function deleteKanbanTaskAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  taskId: string
): void {
  addEvent("delete_kanban_task", {
    chat_id: chatId,
    chat_type: chatType,
    task_id: taskId,
  });
}

export function reorderKanbanTaskAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  taskId: string,
  columnId: string,
  newPosition: number
): void {
  addEvent("reorder_kanban_task", {
    chat_id: chatId,
    chat_type: chatType,
    task_id: taskId,
    column_id: columnId,
    new_position: newPosition,
  });
}

export function moveKanbanTaskAction(
  addEvent: AddEvent,
  chatId: string,
  chatType: ChatType,
  taskId: string,
  fromColumnId: string,
  toColumnId: string,
  newPosition: number
): void {
  addEvent("move_kanban_task", {
    chat_id: chatId,
    chat_type: chatType,
    task_id: taskId,
    from_column_id: fromColumnId,
    to_column_id: toColumnId,
    new_position: newPosition,
  });
}
