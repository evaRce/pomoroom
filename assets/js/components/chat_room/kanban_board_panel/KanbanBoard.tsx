import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Button } from "../../../../components-shadcn/ui/button";
import { useEventContext, useEvent } from "../EventContext";
import { KanbanColumn, KanbanTaskLimitWarningModal } from "./KanbanBoardComponents.tsx";
import { KANBAN_TEXT } from "./kanbanText";
import type { Column, ColumnId, Task } from "./KanbanBoardComponents.tsx";

const MAX_COLUMNS = 5;
const MAX_TASKS_PER_COLUMN = 20;

interface TaskLocation {
  columnId: ColumnId;
  taskIndex: number;
  task: Task;
}

interface KanbanBoardProps {
  chatId: string;
  chatType: "group" | "private";
}

function mapServerColumn(column: any): Column {
  return {
    id: column.column_id || column.columnId || "",
    title: column.title || "",
    tasks: Array.isArray(column.tasks)
      ? column.tasks.map((task: any) => ({
        id: task.task_id || task.id || "",
        title: task.title || "",
      }))
      : [],
  };
}

function buildColumnRecord<T>(columns: Column[], value: T): Record<ColumnId, T> {
  return columns.reduce<Record<ColumnId, T>>((acc, column) => {
    acc[column.id] = value;
    return acc;
  }, {} as Record<ColumnId, T>);
}

function findTaskLocation(columns: Column[], taskId: string): TaskLocation | null {
  for (const column of columns) {
    const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) {
      return {
        columnId: column.id,
        taskIndex,
        task: column.tasks[taskIndex],
      };
    }
  }

  return null;
}

function getInsertionIndex(
  activeRect: { top: number; height: number } | null | undefined,
  overRect: { top: number; height: number },
  targetIndex: number
) {
  if (!activeRect) {
    return targetIndex;
  }

  const activeCenterY = activeRect.top + activeRect.height / 2;
  const overCenterY = overRect.top + overRect.height / 2;

  return activeCenterY > overCenterY ? targetIndex + 1 : targetIndex;
}

export function KanbanBoard({ chatId, chatType }: KanbanBoardProps) {
  const { addEvent, getEventData, removeEvent } = useEventContext() as any;
  const [columns, setColumns] = useState<Column[]>([]);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<ColumnId, string>>({});
  const [showAddInput, setShowAddInput] = useState<Record<ColumnId, boolean>>({});
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnInputRef, setNewColumnInputRef] = useState<HTMLInputElement | null>(null);
  const [newColumnInputId, setNewColumnInputId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [highlightedColumnId, setHighlightedColumnId] = useState<ColumnId | null>(null);
  const [dragPreview, setDragPreview] = useState<{ columnId: ColumnId; taskIndex: number } | null>(null);
  const [showTaskLimitModal, setShowTaskLimitModal] = useState(false);
  const boardLoadedRef = useRef(false);

  // Events
  const kanbanColumnRenamedEvent = useEvent("kanban_column_renamed");
  const kanbanColumnAddedEvent = useEvent("kanban_column_added");
  const kanbanColumnRemovedEvent = useEvent("kanban_column_removed");
  const kanbanTaskAddedEvent = useEvent("kanban_task_added");
  const kanbanTaskMovedEvent = useEvent("kanban_task_moved");
  const kanbanTaskReorderedEvent = useEvent("kanban_task_reordered");
  const kanbanTaskRenamedEvent = useEvent("kanban_task_renamed");
  const kanbanTaskDeletedEvent = useEvent("kanban_task_deleted");


  const applyBoard = (board: any) => {
    const nextColumns = Array.isArray(board?.columns)
      ? board.columns.map(mapServerColumn)
      : [];

    boardLoadedRef.current = true;
    setColumns(nextColumns);
    setNewTaskInputs(buildColumnRecord(nextColumns, ""));
    setShowAddInput(buildColumnRecord(nextColumns, false));
  };

  useEffect(() => {
    boardLoadedRef.current = false;
    setColumns([]);
    setNewTaskInputs({});
    setShowAddInput({});
    setActiveTaskId(null);
    setDraggedTaskId(null);
    setHighlightedColumnId(null);
    setDragPreview(null);
  }, [chatId, chatType]);

  useEffect(() => {
    let cancelled = false;

    const loadDefaultColumns = async () => {
      try {
        const response = await fetch("/api/kanban/default-columns", {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load default Kanban columns: ${response.status}`);
        }

        const payload = await response.json();
        const nextColumns = Array.isArray(payload?.data)
          ? payload.data.map(mapServerColumn)
          : [];

        if (cancelled || boardLoadedRef.current) {
          return;
        }

        setColumns(nextColumns);
        setNewTaskInputs(buildColumnRecord(nextColumns, ""));
        setShowAddInput(buildColumnRecord(nextColumns, false));
      } catch (error) {
        console.error("Unable to load default Kanban columns", error);
      }
    };

    loadDefaultColumns();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    addEvent("get_kanban_board", {
      chat_id: chatId,
      chat_type: chatType,
    });
  }, [addEvent, chatId, chatType]);

  useEffect(() => {
    const payload = getEventData("show_kanban_board");

    if (!payload) {
      return;
    }
    applyBoard(payload.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("show_kanban_board");
  }, [getEventData("show_kanban_board"), removeEvent]);

  useEffect(() => {
    if (!kanbanColumnRenamedEvent) return;

    applyBoard(kanbanColumnRenamedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_column_renamed");
  }, [kanbanColumnRenamedEvent]);

  useEffect(() => {
    if (!kanbanColumnAddedEvent) return;

    applyBoard(kanbanColumnAddedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_column_added");
  }, [kanbanColumnAddedEvent]);

  useEffect(() => {
    if (!kanbanColumnRemovedEvent) return;

    applyBoard(kanbanColumnRemovedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_column_removed");
  }, [kanbanColumnRemovedEvent]);

  useEffect(() => {
    if (!kanbanTaskAddedEvent) return;

    applyBoard(kanbanTaskAddedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_task_added");
  }, [kanbanTaskAddedEvent]);

  useEffect(() => {
    if (!kanbanTaskMovedEvent) return;

    applyBoard(kanbanTaskMovedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_task_moved");
  }, [kanbanTaskMovedEvent]);

  useEffect(() => {
    if (!kanbanTaskReorderedEvent) return;

    applyBoard(kanbanTaskReorderedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_task_reordered");
  }, [kanbanTaskReorderedEvent]);

  useEffect(() => {
    if (!kanbanTaskRenamedEvent) return;

    applyBoard(kanbanTaskRenamedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_task_renamed");
  }, [kanbanTaskRenamedEvent]);

  useEffect(() => {
    if (!kanbanTaskDeletedEvent) return;

    applyBoard(kanbanTaskDeletedEvent.board);
    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_task_deleted");
  }, [kanbanTaskDeletedEvent]);

  useEffect(() => {
    const payload = getEventData("kanban_board_error");

    if (!payload) {
      return;
    }

    console.error("Kanban error", payload);

    setDraggedTaskId(null);
    setDragPreview(null);

    removeEvent("kanban_board_error");
  }, [getEventData("kanban_board_error"), removeEvent]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const handleShowAddTaskInput = (columnId: ColumnId) => {
    const column = columns.find((col) => col.id === columnId);
    if (column && column.tasks.length >= MAX_TASKS_PER_COLUMN) {
      setShowTaskLimitModal(true);
      return;
    }

    setShowAddInput((prev) => ({ ...prev, [columnId]: true }));
  };

  const handleAddTask = (columnId: ColumnId) => {
    const taskTitle = newTaskInputs[columnId]?.trim();
    if (!taskTitle) return;

    const column = columns.find((col) => col.id === columnId);
    if (column && column.tasks.length >= MAX_TASKS_PER_COLUMN) {
      setShowTaskLimitModal(true);
      return;
    }

    setNewTaskInputs((prev) => ({ ...prev, [columnId]: "" }));
    setShowAddInput((prev) => ({ ...prev, [columnId]: false }));

    addEvent("add_kanban_task", {
      chat_id: chatId,
      chat_type: chatType,
      column_id: columnId,
      title: taskTitle,
    });
  };

  const handleDeleteTask = (columnId: ColumnId, taskId: string) => {
    addEvent("delete_kanban_task", {
      chat_id: chatId,
      chat_type: chatType,
      task_id: taskId,
    });
  };

  const handleRenameTask = (columnId: ColumnId, taskId: string, nextTitle: string) => {
    addEvent("rename_kanban_task", {
      chat_id: chatId,
      chat_type: chatType,
      task_id: taskId,
      title: nextTitle,
    });
  };

  const handleAddColumn = () => {
    if (columns.length >= MAX_COLUMNS || isAddingColumn) return;
    setIsAddingColumn(true);
    setNewColumnTitle("");
    const newId = `column-${Date.now()}`;
    setNewColumnInputId(newId);
  };

  // Focus the input when adding a column
  React.useEffect(() => {
    if (isAddingColumn && newColumnInputRef) {
      newColumnInputRef.focus();
    }
  }, [isAddingColumn, newColumnInputRef]);

  const handleConfirmAddColumn = () => {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    setIsAddingColumn(false);
    setNewColumnTitle("");
    setNewColumnInputId(null);

    addEvent("add_kanban_column", {
      chat_id: chatId,
      chat_type: chatType,
      title: trimmed,
    });
  };

  const handleCancelAddColumn = () => {
    setIsAddingColumn(false);
    setNewColumnTitle("");
    setNewColumnInputId(null);
  };

  const handleRenameColumn = (columnId: ColumnId) => {
    const currentColumn = columns.find((column) => column.id === columnId);
    if (!currentColumn) return;

    const nextTitle = window.prompt(KANBAN_TEXT.column.rename.prompt, currentColumn.title);
    if (!nextTitle) return;

    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === currentColumn.title) return;

    addEvent("rename_kanban_column", {
      chat_id: chatId,
      chat_type: chatType,
      column_id: columnId,
      title: trimmed,
    });
  };

  const handleDeleteColumn = (columnId: ColumnId) => {
    addEvent("remove_kanban_column", {
      chat_id: chatId,
      chat_type: chatType,
      column_id: columnId,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setActiveTaskId(activeId);
    setDraggedTaskId(activeId);
    setDragPreview(null);

    const from = findTaskLocation(columns, activeId);
    setHighlightedColumnId(from?.columnId ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setHighlightedColumnId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const overType = over.data.current?.type;

    if (overType === "task") {
      const to = findTaskLocation(columns, overId);
      setHighlightedColumnId(to?.columnId ?? null);
    } else if (overType === "column") {
      const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
      setHighlightedColumnId(targetColumnId ?? null);
    } else {
      setHighlightedColumnId(null);
    }

    const from = findTaskLocation(columns, activeId);
    if (!from) {
      setDragPreview(null);
      return;
    }

    if (overType === "task") {
      const to = findTaskLocation(columns, overId);
      if (!to) {
        setDragPreview(null);
        return;
      }

      const activeRect = active.rect.current.translated;
      const insertionIndex = getInsertionIndex(activeRect, over.rect, to.taskIndex);

      setDragPreview({
        columnId: to.columnId,
        taskIndex: insertionIndex,
      });
      return;
    }

    if (overType === "column") {
      const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
      if (!targetColumnId) {
        setDragPreview(null);
        return;
      }

      setDragPreview({
        columnId: targetColumnId,
        taskIndex: columns.find((column) => column.id === targetColumnId)?.tasks.length ?? 0,
      });
      return;
    }

    setDragPreview(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setHighlightedColumnId(null);

    const activeId = String(active.id);
    const from = findTaskLocation(columns, activeId);
    const dropTarget = dragPreview;

    if (!from) {
      setDraggedTaskId(null);
      setDragPreview(null);
      return;
    }

    if (dropTarget) {
      if (dropTarget.columnId === from.columnId) {
        addEvent("reorder_kanban_task", {
          chat_id: chatId,
          chat_type: chatType,
          task_id: from.task.id,
          column_id: from.columnId,
          new_position: dropTarget.taskIndex,
        });
      } else {
        addEvent("move_kanban_task", {
          chat_id: chatId,
          chat_type: chatType,
          task_id: from.task.id,
          from_column_id: from.columnId,
          to_column_id: dropTarget.columnId,
          new_position: dropTarget.taskIndex,
        });
      }

      return;
    }

    if (!over) {
      setDraggedTaskId(null);
      setDragPreview(null);
      return;
    }

    const overId = String(over.id);
    if (activeId === overId) {
      setDraggedTaskId(null);
      setDragPreview(null);
      return;
    }

    const overType = over.data.current?.type;

    if (overType === "task") {
      const to = findTaskLocation(columns, overId);
      if (!to) {
        setDraggedTaskId(null);
        setDragPreview(null);
        return;
      }

      if (from.columnId === to.columnId) {
        addEvent("reorder_kanban_task", {
          chat_id: chatId,
          chat_type: chatType,
          task_id: from.task.id,
          column_id: from.columnId,
          new_position: to.taskIndex,
        });

        return;
      }

      addEvent("move_kanban_task", {
        chat_id: chatId,
        chat_type: chatType,
        task_id: from.task.id,
        from_column_id: from.columnId,
        to_column_id: to.columnId,
        new_position: to.taskIndex,
      });

      return;
    }

    if (overType === "column") {
      const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
      if (!targetColumnId || targetColumnId === from.columnId) {
        setDraggedTaskId(null);
        setDragPreview(null);
        return;
      }

      addEvent("move_kanban_task", {
        chat_id: chatId,
        chat_type: chatType,
        task_id: from.task.id,
        from_column_id: from.columnId,
        to_column_id: targetColumnId,
        new_position: columns.find((column) => column.id === targetColumnId)?.tasks.length ?? 0,
      });

      return;
    }

    setDraggedTaskId(null);
    setDragPreview(null);
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setDraggedTaskId(null);
    setHighlightedColumnId(null);
    setDragPreview(null);
  };

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return findTaskLocation(columns, activeTaskId)?.task ?? null;
  }, [columns, activeTaskId]);

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    return closestCenter(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-w-0 w-full bg-gray-50">
        <div
          className="kanban-horizontal-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex w-max min-w-full gap-4 p-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                isHighlighted={highlightedColumnId === column.id}
                dragPreviewIndex={dragPreview?.columnId === column.id ? dragPreview.taskIndex : null}
                activeTaskId={draggedTaskId}
                showAddInput={showAddInput[column.id]}
                newTaskValue={newTaskInputs[column.id]}
                onShowAdd={() => handleShowAddTaskInput(column.id)}
                onChangeNewTask={(value) =>
                  setNewTaskInputs((prev) => ({ ...prev, [column.id]: value }))
                }
                onAddTask={() => handleAddTask(column.id)}
                onCancelAdd={() =>
                  setShowAddInput((prev) => ({ ...prev, [column.id]: false }))
                }
                onDeleteTask={handleDeleteTask}
                onRenameTask={handleRenameTask}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            <div className="w-52 shrink-0 rounded-xl border border-dashed border-slate-300 bg-white/70 p-2 flex items-center justify-center min-h-[56px]">
              {isAddingColumn ? (
                <div className="flex flex-col gap-2 w-full">
                  <input
                    ref={setNewColumnInputRef}
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmAddColumn();
                      if (e.key === "Escape") handleCancelAddColumn();
                    }}
                    className="h-9 text-sm bg-card border border-gray-300 rounded-md px-3 focus:ring-sky-500 focus:ring-2 outline-none"
                    placeholder={KANBAN_TEXT.column.add.inputPlaceholder}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-sky-300 text-slate-800 hover:bg-sky-400"
                      onClick={handleConfirmAddColumn}
                    >
                      {KANBAN_TEXT.column.createButton}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      onClick={handleCancelAddColumn}
                    >
                      {KANBAN_TEXT.column.cancelButton}
                    </Button>
                  </div>
                </div>
              ) : columns.length >= MAX_COLUMNS ? (
                <span
                  className="block w-full text-center text-base text-amber-700 bg-amber-100 rounded px-2 py-1"
                  title={KANBAN_TEXT.column.limitReachedMessage(MAX_COLUMNS)}
                >
                  {KANBAN_TEXT.column.limitReachedMessage(MAX_COLUMNS)}
                </span>
              ) : (
                <Button
                  type="button"
                  className="w-full h-9 bg-sky-300 text-slate-800 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleAddColumn}
                  disabled={columns.length >= MAX_COLUMNS}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {KANBAN_TEXT.column.add.button}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <KanbanTaskLimitWarningModal
        open={showTaskLimitModal}
        onClose={() => setShowTaskLimitModal(false)}
        title={KANBAN_TEXT.task.limitReached.title(MAX_TASKS_PER_COLUMN)}
        content={KANBAN_TEXT.task.limitReached.content(MAX_TASKS_PER_COLUMN)}
      />

      <DragOverlay
        dropAnimation={{
          duration: 180,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {activeTask ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-sky-300 shadow-2xl scale-[1.02]">
            <GripVertical className="h-4 w-4 text-slate-500 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
