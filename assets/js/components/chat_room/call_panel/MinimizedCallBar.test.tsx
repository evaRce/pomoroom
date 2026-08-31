import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider } from "../EventContext";
import MinimizedCallBar from "./MinimizedCallBar";
import { initI18n } from "../../../i18n";

const useCallContextMock = vi.fn();
const useLocalParticipantMock = vi.fn();

vi.mock("./CallContext", () => ({
  useCallContext: () => useCallContextMock(),
}));

vi.mock("@livekit/components-react", () => ({
  useLocalParticipant: () => useLocalParticipantMock(),
}));

beforeAll(() => {
  initI18n("es");
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

    const { container } = render(
      <EventProvider>
        <MinimizedCallBar />
      </EventProvider>
    );
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

    const { container } = render(
      <EventProvider>
        <MinimizedCallBar />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
