import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  KanbanColumn,
  KanbanTaskLimitWarningModal,
} from "./KanbanBoardComponents";
import type { Column } from "./KanbanBoardComponents";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function baseColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: "col-1",
    title: "Por hacer",
    tasks: [],
    ...overrides,
  };
}

function columnHandlers() {
  return {
    onShowAdd: vi.fn(),
    onChangeNewTask: vi.fn(),
    onAddTask: vi.fn(),
    onCancelAdd: vi.fn(),
    onDeleteTask: vi.fn(),
    onRenameTask: vi.fn(),
    onMoveTask: vi.fn(),
    onRenameColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
  };
}

function renderColumn(overrides: Partial<Column> = {}, extraProps: Record<string, unknown> = {}) {
  const handlers = columnHandlers();
  const column = baseColumn(overrides);

  const utils = render(
    <KanbanColumn
      column={column}
      otherColumns={[]}
      isHighlighted={false}
      showAddInput={false}
      newTaskValue=""
      {...handlers}
      {...extraProps}
    />,
  );

  return { ...utils, handlers, column };
}

describe("KanbanColumn accessibility", () => {
  it("has no violations for an empty column", async () => {
    const { container } = renderColumn();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with tasks and the add-task input open", async () => {
    const { container } = renderColumn(
      { tasks: [{ id: "t1", title: "Escribir memoria" }] },
      { showAddInput: true },
    );
    expect(await axe(container, { rules: { "nested-interactive": { enabled: false } } })).toHaveNoViolations();
  });
});

describe("KanbanColumn rendering", () => {
  it("shows the column title and the task count badge", () => {
    renderColumn({ title: "En curso", tasks: [{ id: "t1", title: "A" }, { id: "t2", title: "B" }] });

    expect(screen.getByRole("heading", { name: "En curso" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no tasks", () => {
    renderColumn();
    expect(screen.getByText("No hay tareas todavía")).toBeInTheDocument();
  });

  it("does not show the empty-state message once a task exists", () => {
    renderColumn({ tasks: [{ id: "t1", title: "A" }] });
    expect(screen.queryByText("No hay tareas todavía")).not.toBeInTheDocument();
  });
});

describe("KanbanColumn add-task flow", () => {
  it("calls onShowAdd when clicking the add-task button", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn();

    await user.click(screen.getByRole("button", { name: "Agregar tarea a Por hacer" }));

    expect(handlers.onShowAdd).toHaveBeenCalledTimes(1);
  });

  it("submits the new task on Enter and cancels on Escape", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn({}, { showAddInput: true, newTaskValue: "Revisar PR" });

    const input = screen.getByPlaceholderText("Título de la tarea...");
    await user.type(input, "{Enter}");
    expect(handlers.onAddTask).toHaveBeenCalledTimes(1);

    await user.type(input, "{Escape}");
    expect(handlers.onCancelAdd).toHaveBeenCalledTimes(1);
  });

  it("reports every keystroke through onChangeNewTask", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn({}, { showAddInput: true });

    await user.type(screen.getByPlaceholderText("Título de la tarea..."), "Hi");

    expect(handlers.onChangeNewTask).toHaveBeenCalledWith("H");
    expect(handlers.onChangeNewTask).toHaveBeenCalledWith("i");
  });
});

describe("KanbanColumn rename and delete", () => {
  it("selecting rename from the column menu never calls onRenameColumn by itself", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn();

    await user.click(screen.getByRole("button", { name: "Opciones de la columna Por hacer" }));
    await user.click(await screen.findByText("Renombrar columna"));

    expect(handlers.onRenameColumn).not.toHaveBeenCalled();
  });

  it("asks for confirmation before deleting the column and deletes on confirm", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn();

    await user.click(screen.getByRole("button", { name: "Opciones de la columna Por hacer" }));
    await user.click(await screen.findByText("Eliminar columna"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(handlers.onDeleteColumn).toHaveBeenCalledWith("col-1");
  });

  it("closes the delete confirmation without deleting when cancelled", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn();

    await user.click(screen.getByRole("button", { name: "Opciones de la columna Por hacer" }));
    await user.click(await screen.findByText("Eliminar columna"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(handlers.onDeleteColumn).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("KanbanColumn task actions", () => {
  it("renames a task on Enter with the trimmed title", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn({ tasks: [{ id: "t1", title: "Original" }] });

    await user.click(screen.getByRole("button", { name: "Opciones de la tarea" }));
    await user.click(await screen.findByText("Editar"));

    const input = screen.getByDisplayValue("Original");
    await user.clear(input);
    await user.type(input, "Actualizado{Enter}");

    expect(handlers.onRenameTask).toHaveBeenCalledWith("col-1", "t1", "Actualizado");
  });

  it("deletes a task after confirming", async () => {
    const user = userEvent.setup();
    const { handlers } = renderColumn({ tasks: [{ id: "t1", title: "Original" }] });

    await user.click(screen.getByRole("button", { name: "Opciones de la tarea" }));
    await user.click(await screen.findByText("Eliminar"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(handlers.onDeleteTask).toHaveBeenCalledWith("col-1", "t1");
  });

  it("does not offer to move a task when there are no other columns", async () => {
    const user = userEvent.setup();
    renderColumn({ tasks: [{ id: "t1", title: "Original" }] });

    await user.click(screen.getByRole("button", { name: "Opciones de la tarea" }));

    expect(await screen.findByText("Editar")).toBeInTheDocument();
    expect(screen.queryByText("Mover a")).not.toBeInTheDocument();
  });

  it("moves a task to another column", async () => {
    const user = userEvent.setup();
    const handlers = columnHandlers();
    const column = baseColumn({ tasks: [{ id: "t1", title: "Original" }] });
    const otherColumns: Column[] = [{ id: "col-2", title: "Hecho", tasks: [] }];

    render(
      <KanbanColumn
        column={column}
        otherColumns={otherColumns}
        isHighlighted={false}
        showAddInput={false}
        newTaskValue=""
        {...handlers}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Opciones de la tarea" }));
    await user.hover(await screen.findByText("Mover a"));
    const target = await screen.findByRole("menuitem", { name: "Mover a la columna Hecho" });
    fireEvent.click(target);

    expect(handlers.onMoveTask).toHaveBeenCalledWith("col-1", "t1", "col-2");
  });
});

describe("KanbanTaskLimitWarningModal", () => {
  it("renders nothing when closed", () => {
    render(
      <KanbanTaskLimitWarningModal
        open={false}
        onClose={vi.fn()}
        title="Límite alcanzado"
        content="No puedes añadir más tareas"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the title and content and calls onClose on confirm", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <KanbanTaskLimitWarningModal
        open
        onClose={onClose}
        title="Límite alcanzado"
        content="No puedes añadir más tareas"
      />,
    );

    expect(screen.getByText("Límite alcanzado")).toBeInTheDocument();
    expect(screen.getByText("No puedes añadir más tareas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entendido" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses a custom button label when provided", () => {
    render(
      <KanbanTaskLimitWarningModal
        open
        onClose={vi.fn()}
        title="Límite alcanzado"
        content="No puedes añadir más tareas"
        buttonText="Vale"
      />,
    );

    expect(screen.getByRole("button", { name: "Vale" })).toBeInTheDocument();
  });
});
