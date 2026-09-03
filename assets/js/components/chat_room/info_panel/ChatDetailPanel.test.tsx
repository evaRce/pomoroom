import React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import ChatDetailPanel from "./ChatDetailPanel";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function HarnessGroupWithMembers() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_detail", {
      chat_id: "chat-1",
      chat_name: "Equipo A",
      group_name: "Equipo A",
      is_group: true,
      image: "/images/avatars/group-1.png",
    });
    addEvent("show_members", {
      members: [
        { nickname: "alice", is_admin: true, image_profile: "/images/avatars/avatar-1.png" },
        { nickname: "bob", is_admin: false, image_profile: "/images/avatars/avatar-2.png" },
      ],
    });
    addEvent("show_user_info", { nickname: "alice" });
  }, []);
  return <ChatDetailPanel />;
}

describe("ChatDetailPanel accessibility", () => {
  it("has no accessibility violations with no chat selected", async () => {
    const { container } = render(
      <EventProvider>
        <ChatDetailPanel />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for a group chat with members listed", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      ));
    });
    const results = await axe(container!, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for the leave-group confirm dialog", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    await user.click(document.querySelector('button[type="button"].text-red-600')!);

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
