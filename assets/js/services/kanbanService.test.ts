import { describe, expect, it, vi } from "vitest";
import {
  addKanbanColumnAction,
  addKanbanTaskAction,
  deleteKanbanTaskAction,
  moveKanbanTaskAction,
  removeKanbanColumnAction,
  renameKanbanColumnAction,
  renameKanbanTaskAction,
  reorderKanbanTaskAction,
  requestKanbanBoardAction,
} from "./kanbanService";

describe("kanbanService", () => {
  it("requestKanbanBoardAction emits get_kanban_board with the chat context", () => {
    const addEvent = vi.fn();
    requestKanbanBoardAction(addEvent, "chat-1", "group");
    expect(addEvent).toHaveBeenCalledWith("get_kanban_board", { chat_id: "chat-1", chat_type: "group" });
  });

  it("addKanbanColumnAction emits add_kanban_column with the title", () => {
    const addEvent = vi.fn();
    addKanbanColumnAction(addEvent, "chat-1", "group", "To do");
    expect(addEvent).toHaveBeenCalledWith("add_kanban_column", {
      chat_id: "chat-1",
      chat_type: "group",
      title: "To do",
    });
  });

  it("renameKanbanColumnAction emits rename_kanban_column with the new title", () => {
    const addEvent = vi.fn();
    renameKanbanColumnAction(addEvent, "chat-1", "group", "col-1", "Doing");
    expect(addEvent).toHaveBeenCalledWith("rename_kanban_column", {
      chat_id: "chat-1",
      chat_type: "group",
      column_id: "col-1",
      title: "Doing",
    });
  });

  it("removeKanbanColumnAction emits remove_kanban_column with the column id", () => {
    const addEvent = vi.fn();
    removeKanbanColumnAction(addEvent, "chat-1", "group", "col-1");
    expect(addEvent).toHaveBeenCalledWith("remove_kanban_column", {
      chat_id: "chat-1",
      chat_type: "group",
      column_id: "col-1",
    });
  });

  it("addKanbanTaskAction emits add_kanban_task with the task title", () => {
    const addEvent = vi.fn();
    addKanbanTaskAction(addEvent, "chat-1", "group", "col-1", "Write report");
    expect(addEvent).toHaveBeenCalledWith("add_kanban_task", {
      chat_id: "chat-1",
      chat_type: "group",
      column_id: "col-1",
      title: "Write report",
    });
  });

  it("renameKanbanTaskAction emits rename_kanban_task with the new title", () => {
    const addEvent = vi.fn();
    renameKanbanTaskAction(addEvent, "chat-1", "group", "task-1", "Write summary");
    expect(addEvent).toHaveBeenCalledWith("rename_kanban_task", {
      chat_id: "chat-1",
      chat_type: "group",
      task_id: "task-1",
      title: "Write summary",
    });
  });

  it("deleteKanbanTaskAction emits delete_kanban_task with the task id", () => {
    const addEvent = vi.fn();
    deleteKanbanTaskAction(addEvent, "chat-1", "group", "task-1");
    expect(addEvent).toHaveBeenCalledWith("delete_kanban_task", {
      chat_id: "chat-1",
      chat_type: "group",
      task_id: "task-1",
    });
  });

  it("reorderKanbanTaskAction emits reorder_kanban_task with the new position", () => {
    const addEvent = vi.fn();
    reorderKanbanTaskAction(addEvent, "chat-1", "group", "task-1", "col-1", 2);
    expect(addEvent).toHaveBeenCalledWith("reorder_kanban_task", {
      chat_id: "chat-1",
      chat_type: "group",
      task_id: "task-1",
      column_id: "col-1",
      new_position: 2,
    });
  });

  it("moveKanbanTaskAction emits move_kanban_task with source and target columns", () => {
    const addEvent = vi.fn();
    moveKanbanTaskAction(addEvent, "chat-1", "group", "task-1", "col-1", "col-2", 0);
    expect(addEvent).toHaveBeenCalledWith("move_kanban_task", {
      chat_id: "chat-1",
      chat_type: "group",
      task_id: "task-1",
      from_column_id: "col-1",
      to_column_id: "col-2",
      new_position: 0,
    });
  });
});
