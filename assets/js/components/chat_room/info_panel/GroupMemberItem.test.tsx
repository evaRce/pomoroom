import React from "react";
import { render, screen, within } from "@testing-library/react";
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

describe("GroupMemberItem rendering", () => {
  it("shows the nickname and hides the admin badge for a regular member", () => {
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
      />
    );

    expect(screen.getByText("carol")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the admin badge for an admin member", () => {
    render(
      <GroupMemberItem
        contact={{ ...contact, is_admin: true }}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
      />
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides the options menu for the current user's own row", () => {
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
        isCurrentUser
      />
    );

    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });

  it("hides the options menu for a non-admin viewer", () => {
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin={false}
      />
    );

    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });

  it("shows the invite button only when rendered inside a modal", () => {
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={vi.fn()}
        imAdmin
        isInModal
      />
    );

    expect(screen.getByRole("button", { name: "Invitar" })).toBeInTheDocument();
  });
});

describe("GroupMemberItem options menu", () => {
  it("promotes a regular member to admin", async () => {
    const user = userEvent.setup();
    const onSetAdmin = vi.fn();
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={onSetAdmin}
        onDelete={vi.fn()}
        imAdmin
      />
    );

    await user.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByText("Establecer como admin"));

    expect(onSetAdmin).toHaveBeenCalledWith("carol", "add");
  });

  it("demotes an admin member", async () => {
    const user = userEvent.setup();
    const onSetAdmin = vi.fn();
    render(
      <GroupMemberItem
        contact={{ ...contact, is_admin: true }}
        onSelect={vi.fn()}
        onSetAdmin={onSetAdmin}
        onDelete={vi.fn()}
        imAdmin
      />
    );

    await user.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByText("Eliminar como admin"));

    expect(onSetAdmin).toHaveBeenCalledWith("carol", "delete");
  });

  it("removes a member after confirming", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={onDelete}
        imAdmin
      />
    );

    await user.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByText("Eliminar miembro"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar miembro" }));

    expect(onDelete).toHaveBeenCalledWith("carol");
  });

  it("does not remove a member when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <GroupMemberItem
        contact={contact}
        onSelect={vi.fn()}
        onSetAdmin={vi.fn()}
        onDelete={onDelete}
        imAdmin
      />
    );

    await user.click(screen.getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByText("Eliminar miembro"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
