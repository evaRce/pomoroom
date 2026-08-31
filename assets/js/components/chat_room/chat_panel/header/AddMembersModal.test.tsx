import React from "react";
import { act, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../EventContext";
import AddMembersModal from "./AddMembersModal";
import { initI18n } from "../../../../i18n";

beforeAll(() => {
  initI18n("es");
});

const chatData = {
  group_data: { name: "Equipo A", invite_link: "https://pomoroom.test/invite/abc" },
};

function HarnessWithContacts() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_my_contacts", [
      { contact_data: { nickname: "carol", image_profile: "/images/avatars/avatar-2.png" } },
    ]);
  }, []);
  return (
    <AddMembersModal
      chatData={chatData}
      isModalVisibleFromAddContacts={vi.fn()}
      isModalVisibleFromHeader
    />
  );
}

describe("AddMembersModal accessibility", () => {
  it("has no accessibility violations with no contacts loaded yet", async () => {
    render(
      <EventProvider>
        <AddMembersModal
          chatData={chatData}
          isModalVisibleFromAddContacts={vi.fn()}
          isModalVisibleFromHeader
        />
      </EventProvider>
    );
    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with contacts listed", async () => {
    await act(async () => {
      render(
        <EventProvider>
          <HarnessWithContacts />
        </EventProvider>
      );
    });
    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
