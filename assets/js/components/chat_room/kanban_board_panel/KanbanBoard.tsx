import React, { useMemo, useState } from "react";
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

const initialColumns: Column[] = [
  {
    id: "todo",
    title: KANBAN_TEXT.column.initialTitle.todo,
    tasks: [],
  },
  {
    id: "inProgress",
    title: KANBAN_TEXT.column.initialTitle.inProgress,
    tasks: [],
  },
  {
    id: "done",
    title: KANBAN_TEXT.column.initialTitle.done,
    tasks: [],
  },
];

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

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<ColumnId, string>>(
    initialColumns.reduce<Record<ColumnId, string>>((acc, column) => {
      acc[column.id] = "";
      return acc;
    }, {})
  );
  const [showAddInput, setShowAddInput] = useState<Record<ColumnId, boolean>>(
    initialColumns.reduce<Record<ColumnId, boolean>>((acc, column) => {
      acc[column.id] = false;
      return acc;
    }, {})
  );
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnInputRef, setNewColumnInputRef] = useState<HTMLInputElement | null>(null);
  const [newColumnInputId, setNewColumnInputId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [highlightedColumnId, setHighlightedColumnId] = useState<ColumnId | null>(null);
  const [showTaskLimitModal, setShowTaskLimitModal] = useState(false);

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

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle,
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    );
    setNewTaskInputs((prev) => ({ ...prev, [columnId]: "" }));
    setShowAddInput((prev) => ({ ...prev, [columnId]: false }));
  };

  const handleDeleteTask = (columnId: ColumnId, taskId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((task) => task.id !== taskId) }
          : col
      )
    );
  };

  const handleRenameTask = (columnId: ColumnId, taskId: string, nextTitle: string) => {
    setColumns((prev) =>
      prev.map((column) => {
        if (column.id !== columnId) return column;

        return {
          ...column,
          tasks: column.tasks.map((task) =>
            task.id === taskId ? { ...task, title: nextTitle } : task
          ),
        };
      })
    );
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
    const newColumnId = newColumnInputId || `column-${Date.now()}`;
    const newColumn: Column = {
      id: newColumnId,
      title: trimmed,
      tasks: [],
    };
    setColumns((prev) => [...prev, newColumn]);
    setNewTaskInputs((prev) => ({ ...prev, [newColumnId]: "" }));
    setShowAddInput((prev) => ({ ...prev, [newColumnId]: false }));
    setIsAddingColumn(false);
    setNewColumnTitle("");
    setNewColumnInputId(null);
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

    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId ? { ...column, title: trimmed } : column
      )
    );
  };

  const handleDeleteColumn = (columnId: ColumnId) => {
    setColumns((prev) => prev.filter((column) => column.id !== columnId));
    setNewTaskInputs((prev) => {
      const { [columnId]: _, ...rest } = prev;
      return rest;
    });
    setShowAddInput((prev) => {
      const { [columnId]: _, ...rest } = prev;
      return rest;
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

          return prev.map((column) => {
            if (column.id !== from.columnId) return column;

            return {
              ...column,
              tasks: arrayMove(column.tasks, from.taskIndex, to.taskIndex),
            };
          });
        }

        return prev.map((column) => {
          if (column.id === from.columnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== from.task.id),
            };
          }

          if (column.id === to.columnId) {
            const alreadyInTarget = column.tasks.some((task) => task.id === from.task.id);
            if (alreadyInTarget) return column;

            const nextTasks = [...column.tasks];
            nextTasks.splice(to.taskIndex, 0, from.task);
            return { ...column, tasks: nextTasks };
          }

          return column;
        });
      }

      if (overType === "column") {
        const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
        if (!targetColumnId || targetColumnId === from.columnId) return prev;

        return prev.map((column) => {
          if (column.id === from.columnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== from.task.id),
            };
          }

          if (column.id === targetColumnId) {
            const alreadyInTarget = column.tasks.some((task) => task.id === from.task.id);
            if (alreadyInTarget) return column;

            return {
              ...column,
              tasks: [...column.tasks, from.task],
            };
          }

          return column;
        });
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
          return prev.map((column) => {
            if (column.id !== from.columnId) return column;
            return {
              ...column,
              tasks: arrayMove(column.tasks, from.taskIndex, to.taskIndex),
            };
          });
        }

        return prev.map((column) => {
          if (column.id === from.columnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== from.task.id),
            };
          }

          if (column.id === to.columnId) {
            const nextTasks = [...column.tasks];
            nextTasks.splice(to.taskIndex, 0, from.task);
            return { ...column, tasks: nextTasks };
          }

          return column;
        });
      }

      if (overType === "column") {
        const targetColumnId = over.data.current?.columnId as ColumnId | undefined;
        if (!targetColumnId || targetColumnId === from.columnId) return prev;

        return prev.map((column) => {
          if (column.id === from.columnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== from.task.id),
            };
          }

          if (column.id === targetColumnId) {
            return {
              ...column,
              tasks: [...column.tasks, from.task],
            };
          }

          return column;
        });
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
