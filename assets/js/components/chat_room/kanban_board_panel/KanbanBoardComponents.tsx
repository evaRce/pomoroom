import React, { useState } from "react";
import { KANBAN_TEXT } from "./kanbanText";
import { Plus, MoreVertical, Pencil, Trash2, GripVertical, AlertTriangle, Trash } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../../../../components-shadcn/ui/button";
import { Input } from "../../../../components-shadcn/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../../../components-shadcn/ui/dropdown-menu";
import { cn } from "../../../../lib/utils";

export type ColumnId = string;


export interface Task {
    id: string;
    title: string;
}

export interface Column {
    id: ColumnId;
    title: string;
    tasks: Task[];
}


type KanbanDialogVariant = "warning" | "danger";

export interface KanbanDialogProps {
    open: boolean;
    variant: KanbanDialogVariant;
    title: string;
    content: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
}

export interface TaskCardProps {
    task: Task;
    columnId: ColumnId;
    onDelete: (columnId: ColumnId, taskId: string) => void;
    onRename: (columnId: ColumnId, taskId: string, nextTitle: string) => void;
}

export interface KanbanColumnProps {
    column: Column;
    isHighlighted: boolean;
    showAddInput: boolean;
    newTaskValue: string;
    onShowAdd: () => void;
    onChangeNewTask: (value: string) => void;
    onAddTask: () => void;
    onCancelAdd: () => void;
    onDeleteTask: (columnId: ColumnId, taskId: string) => void;
    onRenameTask: (columnId: ColumnId, taskId: string, nextTitle: string) => void;
    onRenameColumn: (columnId: ColumnId) => void;
    onDeleteColumn: (columnId: ColumnId) => void;
}

export interface KanbanTaskLimitWarningModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    content: string;
    buttonText?: string;
}

function KanbanDialog({
    open,
    variant,
    title,
    content,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onClose,
}: KanbanDialogProps) {
    if (!open) return null;

    const styles =
        variant === "warning"
            ? {
                border: "border-slate-200",
                icon: "text-amber-500 bg-amber-100",
                title: "text-slate-900",
                body: "text-amber-700 mb-7",
                button: "bg-amber-100 text-amber-600 hover:bg-amber-500  hover:text-white focus:ring-amber-300 m-0",
                cancel: "border border-amber-100 bg-white text-amber-700 hover:bg-amber-50",
            }
            : {
                border: "border-slate-200",
                icon: "text-red-500 bg-red-100",
                title: "text-slate-900",
                body: "text-slate-700",
                button: "border border-red-300 bg-white text-red-500 hover:bg-red-50 focus:ring-red-300",
                cancel: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-2 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                className={cn("w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl", styles.border)}
            >
                {/* Row 1: Icon + Title */}
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            styles.icon
                        )}
                    >
                        {variant === "warning" ? (
                            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                        ) : (
                            <Trash className="h-5 w-5" strokeWidth={2} />
                        )}
                    </div>
                    <h2 className={cn("text-lg font-semibold leading-6", styles.title)}>{title}</h2>
                </div>

                {/* Row 2: Separator */}
                <div className="mb-3 border-t border-slate-200" aria-hidden="true" />

                {/* Row 3: Content */}
                <div className={cn("text-sm leading-6 mb-2", styles.body)}>{content}</div>

                {/* Row 4: Separator */}
                <div className="mb-3 border-t border-slate-100" aria-hidden="true" />

                {/* Row 5: Actions */}
                <div className="flex items-center justify-end gap-2 my-0">
                    {cancelLabel ? (
                        <button
                            type="button"
                            className={cn(
                                "rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                                styles.cancel
                            )}
                            onClick={onClose}
                        >
                            {cancelLabel}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className={cn(
                            "rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                            styles.button
                        )}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TaskCard({
    task,
    columnId,
    onDelete,
    onRename,
}: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(task.title);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: "task",
            taskId: task.id,
            columnId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const submitRename = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== task.title) {
            onRename(columnId, task.id, trimmed);
        }

        setEditValue(trimmed || task.title);
        setIsEditing(false);
    };

    const startEditing = () => {
        setEditValue(task.title);
        setIsEditing(true);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "group flex items-start gap-2 p-3 rounded-lg bg-white border border-border hover:border-sky-400 transition-all duration-200 ease-out",
                    isEditing ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                    isDragging ? "opacity-40 shadow-lg" : "opacity-100"
                )}
            >
                <div className="flex h-5 w-5 items-center justify-center shrink-0 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onBlur={submitRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submitRename();
                                if (e.key === "Escape") {
                                    setEditValue(task.title);
                                    setIsEditing(false);
                                }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                        />
                    ) : (
                        <p className="w-full text-left text-sm text-slate-700 leading-relaxed hover:text-slate-900">
                            {task.title}
                        </p>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:bg-sky-300 hover:text-slate-700 shrink-0"
                            aria-label="Task options"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-white">
                        <DropdownMenuItem onClick={startEditing} className="focus:bg-sky-100 outline-none">
                            <Pencil className="h-4 w-4 mr-2" />
                            {KANBAN_TEXT.task.editButton}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="focus:bg-red-100 outline-none hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4 mr-2 hover:text-red-500" />
                            {KANBAN_TEXT.task.delete.okButton}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <KanbanDialog
                open={showDeleteDialog}
                variant="danger"
                title={KANBAN_TEXT.task.delete.title}
                content={
                    <>
                        <p className="mt-2 text-base mb-0">{KANBAN_TEXT.task.delete.confirmMessage}</p>
                        <p className="mt-2 text-sm text-rose-500 my-0">{KANBAN_TEXT.task.delete.irreversibleWarning}</p>
                    </>
                }
                confirmLabel={KANBAN_TEXT.task.delete.okButton}
                cancelLabel={KANBAN_TEXT.task.cancelButton}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={() => {
                    onDelete(columnId, task.id);
                    setShowDeleteDialog(false);
                }}
            />
        </>
    );
}

export function KanbanColumn({
    column,
    isHighlighted,
    showAddInput,
    newTaskValue,
    onShowAdd,
    onChangeNewTask,
    onAddTask,
    onCancelAdd,
    onDeleteTask,
    onRenameTask,
    onRenameColumn,
    onDeleteColumn,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: {
            type: "column",
            columnId: column.id,
        },
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <div
                ref={setNodeRef}
                className={cn(
                    "flex flex-col w-80 shrink-0 rounded-xl bg-gray-50 border border-gray-200 transition-colors",
                    (isOver || isHighlighted) && "border-primary border-dashed bg-sky-100"
                )}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-700">{column.title}</h3>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-slate-700">
                            {column.tasks.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-sky-300"
                            onClick={onShowAdd}
                            aria-label={KANBAN_TEXT.column.add.taskLabel(column.title)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-sky-300"
                                    aria-label={`Column options for ${column.title}`}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-auto bg-white">
                                <DropdownMenuItem
                                    onClick={() => onRenameColumn(column.id)}
                                    className="focus:bg-sky-100 outline-none"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {KANBAN_TEXT.column.rename.button}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="focus:bg-red-100 outline-none hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {KANBAN_TEXT.column.delete.title}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto min-h-24">
                    <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                        {column.tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                columnId={column.id}
                                onDelete={onDeleteTask}
                                onRename={onRenameTask}
                            />
                        ))}
                    </SortableContext>

                    {showAddInput && (
                        <div className="flex flex-col gap-2 p-2 rounded-lg bg-gray-50 border border-gray-300">
                            <Input
                                placeholder={KANBAN_TEXT.task.inputPlaceholder}
                                value={newTaskValue}
                                onChange={(e) => onChangeNewTask(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") onAddTask();
                                    if (e.key === "Escape") onCancelAdd();
                                }}
                                className="h-9 text-sm bg-card border-none focus:ring-sky-500 focus:ring-2"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <Button size="sm" className="h-7 text-xs bg-sky-300 text-slate-800 hover:bg-sky-400" onClick={onAddTask}>
                                    {KANBAN_TEXT.task.addButton}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                    onClick={onCancelAdd}
                                >
                                    {KANBAN_TEXT.task.cancelButton}
                                </Button>
                            </div>
                        </div>
                    )}

                    {column.tasks.length === 0 && !showAddInput && (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <p className="text-xs">{KANBAN_TEXT.task.emptyListMessage}</p>
                        </div>
                    )}
                </div>
            </div>

            <KanbanDialog
                open={showDeleteDialog}
                variant="danger"
                title={KANBAN_TEXT.column.delete.title}
                content={
                    <>
                        <p className="mt-2 text-base mb-0">{KANBAN_TEXT.column.delete.confirmMessage(column.title)}</p>
                        <p className="mt-2 text-sm text-rose-500 my-0">{KANBAN_TEXT.column.delete.irreversibleWarning}</p>
                    </>
                }
                confirmLabel={KANBAN_TEXT.column.delete.okButton}
                cancelLabel={KANBAN_TEXT.column.cancelButton}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={() => {
                    onDeleteColumn(column.id);
                    setShowDeleteDialog(false);
                }}
            />
        </>
    );
}

export function KanbanTaskLimitWarningModal({
    open,
    onClose,
    title,
    content,
    buttonText,
}: KanbanTaskLimitWarningModalProps) {
    return (
        <KanbanDialog
            open={open}
            variant="warning"
            title={title}
            content={content}
            confirmLabel={buttonText || "Entendido"}
            onConfirm={onClose}
            onClose={onClose}
        />
    );
}
