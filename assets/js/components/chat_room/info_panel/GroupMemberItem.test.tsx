import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import GroupMemberItem from "./GroupMemberItem";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

const contact = {
  nickname: "carol",
  image_profile: "/images/avatars/avatar-2.png",
  is_admin: false,
};

describe("GroupMemberItem accessibility", () => {
  it("has no accessibility violations for a regular member", async () => {
    const { container } = render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with the member options menu open", async () => {
    const user = userEvent.setup();
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
      />
    );

    await user.click(document.querySelector("button")!);

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for the current user's own row", async () => {
    const { container } = render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
        isCurrentUser
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
