import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider } from "../EventContext";
import ConversationTargetItem from "./ConversationTargetItem";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

const acceptedContact = {
  name: "Alice",
  chat_id: "chat-1",
  image: "/images/avatars/avatar-1.png",
  status_request: "accepted",
  is_group: false,
  is_group_member_removed: false,
  is_group_admin: false,
};

describe("ConversationTargetItem accessibility", () => {
  it("has no accessibility violations for an accepted contact", async () => {
    const { container } = render(
      <EventProvider>
        <ConversationTargetItem
          contact={acceptedContact}
          isSelected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
        />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for a pending contact request", async () => {
    const pendingContact = { ...acceptedContact, chat_id: "chat-2", status_request: "pending" };
    const { container } = render(
      <EventProvider>
        <ConversationTargetItem
          contact={pendingContact}
          isSelected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
        />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for the confirm-delete dialog", async () => {
    const user = userEvent.setup();
    const contact = { ...acceptedContact, chat_id: "chat-3" };
    render(
      <EventProvider>
        <ConversationTargetItem
          contact={contact}
          isSelected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
        />
      </EventProvider>
    );

    await user.click(document.querySelector("button")!);
    await user.click(document.querySelector('[role="menuitem"]')!);

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
