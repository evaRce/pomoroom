import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider } from "../EventContext";
import AddContactOrGroup from "./AddContactOrGroup";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

describe("AddContactOrGroup accessibility", () => {
  it("has no accessibility violations when the add-contact modal is open", async () => {
    render(
      <EventProvider>
        <AddContactOrGroup sendDataToParent={vi.fn()} receiveDataFromParent entryType="contact" />
      </EventProvider>
    );
    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when the create-group modal is open", async () => {
    render(
      <EventProvider>
        <AddContactOrGroup sendDataToParent={vi.fn()} receiveDataFromParent entryType="group" />
      </EventProvider>
    );
    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
