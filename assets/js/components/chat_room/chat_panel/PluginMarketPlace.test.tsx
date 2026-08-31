import React from "react";
import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import PluginMarketPlace from "./PluginMarketPlace";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PluginMarketPlace accessibility", () => {
  it("has no accessibility violations when closed", async () => {
    const { container } = render(
      <PluginMarketPlace
        open={false}
        onOpenChange={vi.fn()}
        installedPlugins={[]}
        onInstallPlugin={vi.fn()}
        onUninstallPlugin={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when open with plugins listed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { type: "pomodoro", name: "Pomodoro", description: "Temporizador de trabajo", icon: "🍅" },
            { type: "kanban", name: "Kanban", description: "Tablero de tareas", icon: "🗂️" },
          ],
        }),
      })
    );

    render(
      <PluginMarketPlace
        open
        onOpenChange={vi.fn()}
        installedPlugins={[{ id: "1", type: "pomodoro", name: "Pomodoro", icon: "🍅" }]}
        onInstallPlugin={vi.fn()}
        onUninstallPlugin={vi.fn()}
      />
    );

    await waitFor(() => expect(document.querySelectorAll("h3").length).toBeGreaterThan(0));

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
