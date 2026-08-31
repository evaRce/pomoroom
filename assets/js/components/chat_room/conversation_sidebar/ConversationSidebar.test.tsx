import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventProvider } from "../EventContext";
import ConversationSidebar from "./ConversationSidebar";
import { initI18n } from "../../../i18n";

vi.mock("../call_panel/CallContext", () => ({
  useCallContext: () => ({
    activeCallChatId: null,
    activeCallRoomName: "",
    activeCallIsGroupChat: false,
    viewingChatId: null,
    setMinimized: vi.fn(),
    leaveCall: vi.fn(),
  }),
}));

vi.mock("@livekit/components-react", () => ({
  useLocalParticipant: () => ({
    localParticipant: { setMicrophoneEnabled: vi.fn() },
    isMicrophoneEnabled: true,
  }),
}));

beforeAll(() => {
  initI18n("es");
});

describe("ConversationSidebar accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <EventProvider>
        <ConversationSidebar />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
