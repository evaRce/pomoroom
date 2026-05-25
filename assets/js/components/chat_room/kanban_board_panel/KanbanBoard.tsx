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
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "../../../../components-shadcn/ui/button";
import { useEventContext } from "../EventContext";
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
  const [highlightedColumnId, setHighlightedColumnId] = useState<ColumnId | null>(null);
  const [showTaskLimitModal, setShowTaskLimitModal] = useState(false);
  const boardLoadedRef = useRef(false);

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
    setHighlightedColumnId(null);
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

    removeEvent("show_kanban_board");
  }, [getEventData("show_kanban_board"), removeEvent]);

  useEffect(() => {
    const payload = getEventData("kanban_board_error");

    if (!payload) {
      return;
    }

    console.error("Kanban error", payload);
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

    setColumns((prev) => {
      const from = findTaskLocation(prev, activeId);
      if (!from) return prev;

      if (overType === "task") {
        const to = findTaskLocation(prev, overId);
        if (!to) return prev;

        if (from.columnId === to.columnId) {
          if (from.taskIndex === to.taskIndex) return prev;

          return prev;
        }

        return prev;
      }

      if (overType === "column") {
        const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
        if (!targetColumnId || targetColumnId === from.columnId) return prev;

        return prev;
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setHighlightedColumnId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setColumns((prev) => {
      const from = findTaskLocation(prev, activeId);
      if (!from) return prev;

      const overType = over.data.current?.type;

      if (overType === "task") {
        const to = findTaskLocation(prev, overId);
        if (!to) return prev;

        if (from.columnId === to.columnId) {
          addEvent("reorder_kanban_task", {
            chat_id: chatId,
            chat_type: chatType,
            task_id: from.task.id,
            column_id: from.columnId,
            new_position: to.taskIndex,
          });

          return prev;
        }

        addEvent("move_kanban_task", {
          chat_id: chatId,
          chat_type: chatType,
          task_id: from.task.id,
          from_column_id: from.columnId,
          to_column_id: to.columnId,
          new_position: to.taskIndex,
        });

        return prev;
      }

      if (overType === "column") {
        const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
        if (!targetColumnId || targetColumnId === from.columnId) return prev;

        addEvent("move_kanban_task", {
          chat_id: chatId,
          chat_type: chatType,
          task_id: from.task.id,
          from_column_id: from.columnId,
          to_column_id: targetColumnId,
          new_position: columns.find((column) => column.id === targetColumnId)?.tasks.length ?? 0,
        });

        return prev;
      }

      return prev;
    });
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setHighlightedColumnId(null);
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
                    onChange={e => setNewColumnTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleConfirmAddColumn()
                      if (e.key === "Escape") handleCancelAddColumn()
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
              ) : (
                columns.length >= MAX_COLUMNS ? (
                  <span className="block w-full text-center text-base text-amber-700 bg-amber-100 rounded px-2 py-1" title={KANBAN_TEXT.column.limitReachedMessage(MAX_COLUMNS)}>
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
                )
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
