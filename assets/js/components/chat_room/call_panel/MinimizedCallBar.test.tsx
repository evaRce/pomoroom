import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import MinimizedCallBar from "./MinimizedCallBar";
import { initI18n } from "../../../i18n";

const useCallContextMock = vi.fn();
const useLocalParticipantMock = vi.fn();
const useEventContextMock = vi.fn();

vi.mock("./CallContext", () => ({
  useCallContext: () => useCallContextMock(),
}));

vi.mock("@livekit/components-react", () => ({
  useLocalParticipant: () => useLocalParticipantMock(),
}));

vi.mock("../EventContext", async () => {
  const actual = await vi.importActual<typeof import("../EventContext")>("../EventContext");
  return {
    ...actual,
    useEventContext: () => useEventContextMock(),
  };
});

beforeAll(() => {
  initI18n("es");
});

beforeEach(() => {
  useEventContextMock.mockReturnValue({ addEvent: vi.fn(), eventsData: {}, removeEvent: vi.fn() });
});

describe("MinimizedCallBar accessibility", () => {
  it("has no accessibility violations when there is no active call", async () => {
    useCallContextMock.mockReturnValue({
      activeCallChatId: null,
      activeCallRoomName: "",
      activeCallIsGroupChat: false,
      viewingChatId: null,
      setMinimized: vi.fn(),
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: true,
    });

    const { container } = render(<MinimizedCallBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations while a call is active", async () => {
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Alice",
      activeCallIsGroupChat: false,
      viewingChatId: "chat-2",
      setMinimized: vi.fn(),
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: false,
    });

    const { container } = render(<MinimizedCallBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("MinimizedCallBar behavior", () => {
  it("renders nothing when there is no active call", () => {
    useCallContextMock.mockReturnValue({
      activeCallChatId: null,
      activeCallRoomName: "",
      activeCallIsGroupChat: false,
      viewingChatId: null,
      setMinimized: vi.fn(),
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: true,
    });

    const { container } = render(<MinimizedCallBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("un-minimizes and notifies mobile navigation when clicking the bar of the chat you are viewing", async () => {
    const user = userEvent.setup();
    const setMinimized = vi.fn();
    const addEvent = vi.fn();
    useEventContextMock.mockReturnValue({ addEvent, eventsData: {}, removeEvent: vi.fn() });
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Alice",
      activeCallIsGroupChat: false,
      viewingChatId: "chat-1",
      setMinimized,
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: true,
    });

    render(<MinimizedCallBar />);
    await user.click(screen.getByText("En llamada").closest('[role="button"]')!);

    expect(setMinimized).toHaveBeenCalledWith(false);
    expect(addEvent).toHaveBeenCalledWith("open_chat_mobile", expect.any(Number));
  });

  it("navigates to the private chat of the active call when viewing a different chat", async () => {
    const user = userEvent.setup();
    const setMinimized = vi.fn();
    const addEvent = vi.fn();
    useEventContextMock.mockReturnValue({ addEvent, eventsData: {}, removeEvent: vi.fn() });
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Alice",
      activeCallIsGroupChat: false,
      viewingChatId: "chat-2",
      setMinimized,
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: true,
    });

    render(<MinimizedCallBar />);
    await user.click(screen.getByText("En llamada").closest('[role="button"]')!);

    expect(addEvent).toHaveBeenCalledWith("selected_private_chat", { contact_name: "Alice" });
    expect(setMinimized).toHaveBeenCalledWith(false);
  });

  it("navigates to the group chat of the active call when it is a group call", async () => {
    const user = userEvent.setup();
    const addEvent = vi.fn();
    useEventContextMock.mockReturnValue({ addEvent, eventsData: {}, removeEvent: vi.fn() });
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Study group",
      activeCallIsGroupChat: true,
      viewingChatId: "chat-2",
      setMinimized: vi.fn(),
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: true,
    });

    render(<MinimizedCallBar />);
    await user.click(screen.getByText("En llamada").closest('[role="button"]')!);

    expect(addEvent).toHaveBeenCalledWith("selected_group_chat", { group_name: "Study group" });
  });

  it("toggles the microphone without triggering the bar navigation", async () => {
    const user = userEvent.setup();
    const setMicrophoneEnabled = vi.fn();
    const setMinimized = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Alice",
      activeCallIsGroupChat: false,
      viewingChatId: "chat-1",
      setMinimized,
      leaveCall: vi.fn(),
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled },
      isMicrophoneEnabled: true,
    });

    render(<MinimizedCallBar />);
    await user.click(screen.getByRole("button", { name: "Silenciar micrófono" }));

    expect(setMicrophoneEnabled).toHaveBeenCalledWith(false);
    expect(setMinimized).not.toHaveBeenCalled();
  });

  it("ends the call without triggering the bar navigation", async () => {
    const user = userEvent.setup();
    const leaveCall = vi.fn();
    const setMinimized = vi.fn();
    useCallContextMock.mockReturnValue({
      activeCallChatId: "chat-1",
      activeCallRoomName: "Alice",
      activeCallIsGroupChat: false,
      viewingChatId: "chat-1",
      setMinimized,
      leaveCall,
    });
    useLocalParticipantMock.mockReturnValue({
      localParticipant: { setMicrophoneEnabled: vi.fn() },
      isMicrophoneEnabled: false,
    });

    render(<MinimizedCallBar />);
    await user.click(screen.getByRole("button", { name: "Finalizar llamada" }));

    expect(leaveCall).toHaveBeenCalledTimes(1);
    expect(setMinimized).not.toHaveBeenCalled();
  });
});
