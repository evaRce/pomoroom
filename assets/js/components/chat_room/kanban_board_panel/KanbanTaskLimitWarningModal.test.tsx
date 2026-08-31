import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { KanbanTaskLimitWarningModal } from "./KanbanBoardComponents";

describe("KanbanTaskLimitWarningModal accessibility", () => {
  it("has no accessibility violations when closed", async () => {
    render(
      <KanbanTaskLimitWarningModal
        open={false}
        onClose={vi.fn()}
        title="Límite alcanzado"
        content="Has alcanzado el límite de tareas de esta columna."
      />
    );
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    render(
      <KanbanTaskLimitWarningModal
        open
        onClose={vi.fn()}
        title="Límite alcanzado"
        content="Has alcanzado el límite de tareas de esta columna."
      />
    );
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
