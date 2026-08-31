import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import BackGround from "./BackGround";

describe("BackGround accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<BackGround imageNumber={1} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
