import React from "react";
import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import ConversationTargetsList from "./ConversationTargetsList";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function Harness() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_list_contact", [
      {
        contact_data: { nickname: "Alice", chat_id: "chat-1", image_profile: "/images/avatars/avatar-1.png" },
        request: { from_user: "me", to_user: "Alice", status: "accepted" },
      },
      {
        contact_data: { nickname: "Bob", chat_id: "chat-2", image_profile: "/images/avatars/avatar-2.png" },
        request: { from_user: "me", to_user: "Bob", status: "pending" },
      },
    ]);
  }, []);
  return <ConversationTargetsList />;
}

function HarnessWithCancelledRequest({ cancelled }: { cancelled: boolean }) {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_user_info", { nickname: "me" });
    addEvent("show_list_contact", [
      {
        contact_data: { nickname: "Alice", chat_id: "chat-1", image_profile: "/images/avatars/avatar-1.png" },
        request: { from_user: "me", to_user: "Alice", status: "accepted" },
      },
      {
        contact_data: { nickname: "Bob", chat_id: null, image_profile: "/images/avatars/avatar-2.png" },
        request: { from_user: "me", to_user: "Bob", status: "pending" },
      },
    ]);
  }, []);

  React.useEffect(() => {
    if (cancelled) {
      addEvent("friend_request_cancelled", { from_user: "me", to_user: "Bob" });
    }
  }, [cancelled]);

  return <ConversationTargetsList />;
}

function EmptyHarness() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_list_contact", []);
  }, []);
  return <ConversationTargetsList />;
}

describe("ConversationTargetsList accessibility", () => {
  it("has no accessibility violations with no contacts loaded", async () => {
    const { container } = render(
      <EventProvider>
        <ConversationTargetsList />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with contacts listed", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <Harness />
        </EventProvider>
      ));
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it("removes the pending contact once its friend request is cancelled", async () => {
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      ({ rerender } = render(
        <EventProvider>
          <HarnessWithCancelledRequest cancelled={false} />
        </EventProvider>
      ));
    });

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();

    await act(async () => {
      rerender(
        <EventProvider>
          <HarnessWithCancelledRequest cancelled={true} />
        </EventProvider>
      );
    });

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("shows the welcome empty state once the confirmed contact list is empty", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <EmptyHarness />
        </EventProvider>
      ));
    });
    expect(screen.getByText("Bienvenid@ a Pomoroom")).toBeTruthy();
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
