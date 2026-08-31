import React from "react";
import { act, render } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import RejectedRequestReceived from "./RejectedRequestReceived";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function Harness() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("open_rejected_request_received", { from_user: "alice", to_user: "bob" });
  }, []);
  return <RejectedRequestReceived imageNumber={4} />;
}

describe("RejectedRequestReceived accessibility", () => {
  it("has no accessibility violations before the request data arrives", async () => {
    const { container } = render(
      <EventProvider>
        <RejectedRequestReceived imageNumber={4} />
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
