import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import CallButton from "./CallButton";
import { initI18n } from "../../../i18n";

const useCallContextMock = vi.fn();

vi.mock("./CallContext", () => ({
  useCallContext: () => useCallContextMock(),
}));

beforeAll(() => {
  initI18n("es");
});

describe("CallButton accessibility", () => {
  it("has no accessibility violations when idle", async () => {
    useCallContextMock.mockReturnValue({
      activeCallChatId: null,
      connectingChatId: null,
      setMinimized: vi.fn(),
      joinCall: vi.fn(),
    });

    const { container } = render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations while a call is active in this chat", async () => {
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      connectingChatId: null,
      setMinimized: vi.fn(),
      joinCall: vi.fn(),
    });

    const { container } = render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("CallButton behavior", () => {
  it("joins the call when idle and clicked", async () => {
    const user = userEvent.setup();
    const joinCall = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: null,
      connectingChatId: null,
      setMinimized: vi.fn(),
      joinCall,
    });

    render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    await user.click(screen.getByRole("button", { name: "Entrar a la sala" }));

    expect(joinCall).toHaveBeenCalledWith("chat-1", "Alice", false);
  });

  it("shows the call room instead of joining again when this chat is already in call", async () => {
    const user = userEvent.setup();
    const joinCall = vi.fn();
    const setMinimized = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      connectingChatId: null,
      setMinimized,
      joinCall,
    });

    render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    await user.click(screen.getByRole("button", { name: "Mostrar sala" }));

    expect(setMinimized).toHaveBeenCalledWith(false);
    expect(joinCall).not.toHaveBeenCalled();
  });

  it("is disabled and does nothing when another call is active elsewhere", async () => {
    const user = userEvent.setup();
    const joinCall = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-2",
      connectingChatId: null,
      setMinimized: vi.fn(),
      joinCall,
    });

    render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    const button = screen.getByRole("button", { name: "Ya estás en otra llamada" });

    expect(button).toBeDisabled();
    await user.click(button, { pointerEventsCheck: 0 });
    expect(joinCall).not.toHaveBeenCalled();
  });

  it("is disabled while this chat is connecting", async () => {
    const user = userEvent.setup();
    const joinCall = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: null,
      connectingChatId: "chat-1",
      setMinimized: vi.fn(),
      joinCall,
    });

    render(<CallButton chatId="chat-1" chatName="Alice" isGroupChat={false} />);
    const button = screen.getByRole("button", { name: "Conectando..." });

    expect(button).toBeDisabled();
    await user.click(button, { pointerEventsCheck: 0 });
    expect(joinCall).not.toHaveBeenCalled();
  });
});
