import React from "react";
import { act, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import RequestReceived from "./RequestReceived";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function Harness() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("open_chat_request_received", { from_user: "alice", to_user: "bob" });
  }, []);
  return <RequestReceived imageNumber={3} />;
}

describe("RequestReceived accessibility", () => {
  it("has no accessibility violations before the request data arrives", async () => {
    const { container } = render(
      <EventProvider>
        <RequestReceived imageNumber={3} />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations once the request data arrives", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <Harness />
        </EventProvider>
      ));
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
