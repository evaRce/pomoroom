import React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import CurrentUserCard from "./CurrentUserCard";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function Harness() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("show_user_info", { nickname: "eve", image_profile: "/images/avatars/avatar-3.png" });
  }, []);
  return <CurrentUserCard />;
}

describe("CurrentUserCard accessibility", () => {
  it("has no accessibility violations before the user info arrives", async () => {
    const { container } = render(
      <EventProvider>
        <CurrentUserCard />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations once the user info arrives", async () => {
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

  it("has no accessibility violations with the options menu open", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <EventProvider>
          <Harness />
        </EventProvider>
      );
    });

    await user.click(document.querySelector("button")!);

    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });
});
