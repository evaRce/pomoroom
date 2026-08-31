import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { PomodoroSettingsPopover } from "./PomodoroSettingsPopover";

const baseSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
};

describe("PomodoroSettingsPopover accessibility", () => {
  it("has no accessibility violations when closed", async () => {
    const { container } = render(
      <PomodoroSettingsPopover
        mode="work"
        settings={baseSettings}
        errors={{}}
        soundEnabled
        saveState="idle"
        hasErrors={false}
        onChange={vi.fn()}
        onToggleSound={vi.fn()}
        onSave={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when open with validation errors", async () => {
    const user = userEvent.setup();
    render(
      <PomodoroSettingsPopover
        mode="shortBreak"
        settings={baseSettings}
        errors={{ workDuration: "Debe ser mayor que 0" }}
        soundEnabled={false}
        saveState="error"
        saveMessage={{ type: "error", text: "No se pudo guardar" }}
        hasErrors
        onChange={vi.fn()}
        onToggleSound={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(document.querySelector("button")!);

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
