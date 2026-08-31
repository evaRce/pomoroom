import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SignUp } from "./SignUp";
import { initI18n } from "../../i18n";

beforeAll(() => {
  initI18n("es");
});

describe("SignUp accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<SignUp submitUser={vi.fn()} errors={{}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with server errors shown", async () => {
    const { container } = render(
      <SignUp submitUser={vi.fn()} errors={{ nickname: "Ese nickname ya existe" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
