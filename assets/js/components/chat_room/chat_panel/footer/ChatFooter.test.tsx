import React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../../EventContext";
import ChatFooter from "./ChatFooter";
import { initI18n } from "../../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function HarnessRemovedFromGroup() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("open_group_chat", {
      chat_id: "chat-1",
      group_data: { name: "Equipo A" },
      removed_at: new Date().toISOString(),
    });
  }, []);
  return <ChatFooter />;
}

describe("ChatFooter accessibility", () => {
  it("has no accessibility violations with no chat selected", async () => {
    const { container } = render(
      <EventProvider>
        <ChatFooter />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with the emoji picker open", async () => {
    const user = userEvent.setup();
    render(
      <EventProvider>
        <ChatFooter />
      </EventProvider>
    );

    await user.click(document.querySelector('button[aria-label]')!);

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when the current user was removed from the group", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <HarnessRemovedFromGroup />
        </EventProvider>
      ));
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
