import React from "react";
import { render } from "@testing-library/react";
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
