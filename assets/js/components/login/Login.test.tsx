import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Login } from "./Login";
import { initI18n } from "../../i18n";

beforeAll(() => {
  initI18n("es");
});

describe("Login accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Login searchUser={vi.fn()} errors={{}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with server errors shown", async () => {
    const { container } = render(
      <Login searchUser={vi.fn()} errors={{ email: "Credenciales inválidas" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
