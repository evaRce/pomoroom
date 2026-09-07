import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import ChatDetailPanel from "./ChatDetailPanel";
import { initI18n } from "../../../i18n";

const toggleDetailVisibilityAction = vi.fn();
const deleteMemberAction = vi.fn();
const deleteGroupForEveryoneAction = vi.fn();
const setGroupAdminAction = vi.fn();

vi.mock("../../../services/contactService", () => ({
  toggleDetailVisibilityAction: (...args: unknown[]) => toggleDetailVisibilityAction(...args),
}));

vi.mock("../../../services/groupService", () => ({
  deleteMemberAction: (...args: unknown[]) => deleteMemberAction(...args),
  deleteGroupForEveryoneAction: (...args: unknown[]) => deleteGroupForEveryoneAction(...args),
  setGroupAdminAction: (...args: unknown[]) => setGroupAdminAction(...args),
}));

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

function HarnessPrivateChat() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_detail", {
      chat_id: "chat-1",
      chat_name: "bob01",
      is_group: false,
      image: "/images/avatars/avatar-2.png",
    });
  }, []);
  return <ChatDetailPanel />;
}

function HarnessGroupAsMember() {
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
    addEvent("show_user_info", { nickname: "bob" });
  }, []);
  return <ChatDetailPanel />;
}

describe("ChatDetailPanel rendering", () => {
  it("shows only the close button when no chat is selected", () => {
    render(
      <EventProvider>
        <ChatDetailPanel />
      </EventProvider>
    );

    expect(screen.getByRole("button", { name: "Cerrar detalles" })).toBeInTheDocument();
    expect(screen.queryByText(/Miembro/)).not.toBeInTheDocument();
  });

  it("shows the chat name for a private chat without a member list or group actions", async () => {
    await act(async () => {
      render(
        <EventProvider>
          <HarnessPrivateChat />
        </EventProvider>
      );
    });

    expect(screen.getByText("bob01")).toBeInTheDocument();
    expect(screen.queryByText(/Miembro/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dejar grupo" })).not.toBeInTheDocument();
  });

  it("shows the member count and list for a group chat", async () => {
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    expect(screen.getByText("2 Miembros")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("only shows the delete-group action to an admin", async () => {
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupAsMember />
        </EventProvider>
      );
    });

    expect(screen.getByRole("button", { name: "Dejar grupo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar grupo" })).not.toBeInTheDocument();
  });

  it("shows the delete-group action when the current user is an admin", async () => {
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    expect(screen.getByRole("button", { name: "Eliminar grupo" })).toBeInTheDocument();
  });
});

describe("ChatDetailPanel actions", () => {
  it("closes the panel and toggles visibility off", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    await user.click(screen.getByRole("button", { name: "Cerrar detalles" }));

    expect(toggleDetailVisibilityAction).toHaveBeenCalledWith(
      expect.any(Function),
      false,
      true,
      "Equipo A"
    );
  });

  it("leaves the group after confirming", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    await user.click(screen.getByRole("button", { name: "Dejar grupo" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Dejar grupo" }));

    expect(deleteMemberAction).toHaveBeenCalledWith(expect.any(Function), "alice", "Equipo A");
  });

  it("deletes the group for everyone after confirming", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    await user.click(screen.getByRole("button", { name: "Eliminar grupo" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar grupo" }));

    expect(deleteGroupForEveryoneAction).toHaveBeenCalledWith(expect.any(Function), "Equipo A");
  });

  it("promotes a member to admin from the rendered member row", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <HarnessGroupWithMembers />
        </EventProvider>
      );
    });

    const bobRow = screen.getByText("bob").closest("div.relative")!;
    await user.click(within(bobRow).getByRole("button", { name: "Más opciones" }));
    await user.click(await screen.findByText("Establecer como admin"));

    expect(setGroupAdminAction).toHaveBeenCalledWith(expect.any(Function), "bob", "Equipo A", "add");
  });
});
