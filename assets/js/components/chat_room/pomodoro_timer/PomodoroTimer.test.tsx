import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeAll, describe, expect, it } from "vitest";
import { EventProvider, useEventContext } from "../EventContext";
import { PomodoroTimer } from "./PomodoroTimer";
import { initI18n } from "../../../i18n";

beforeAll(() => {
  initI18n("es");
});

function HarnessLoaded() {
  const { addEvent } = useEventContext();
  React.useEffect(() => {
    addEvent("pomodoro_state_loaded", {
      chat_id: "chat-1",
      chat_type: "private",
      timer_id: "timer-1",
      config: {
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        cycles_before_long_break: 4,
      },
      state: {
        mode: "work",
        is_running: false,
        started_at: null,
        paused_at: null,
        time_left: 1500,
        cycles_completed: 0,
        has_pending_work_half_cycle: false,
        settings: {
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          cycles_before_long_break: 4,
        },
        last_updated: Date.now(),
      },
    });
  }, []);
  return <PomodoroTimer chatId="chat-1" chatType="private" />;
}

function HarnessWithEmitter({
  emitterRef,
}: {
  emitterRef: React.MutableRefObject<ReturnType<typeof useEventContext>["addEvent"] | null>;
}) {
  const { addEvent } = useEventContext();
  emitterRef.current = addEvent;
  React.useEffect(() => {
    addEvent("pomodoro_state_loaded", {
      chat_id: "chat-1",
      chat_type: "private",
      timer_id: "timer-1",
      config: {
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        cycles_before_long_break: 4,
      },
      state: {
        mode: "work",
        is_running: false,
        started_at: null,
        paused_at: null,
        time_left: 1500,
        cycles_completed: 0,
        has_pending_work_half_cycle: false,
        settings: {
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          cycles_before_long_break: 4,
        },
        last_updated: Date.now(),
      },
    });
  }, []);
  return <PomodoroTimer chatId="chat-1" chatType="private" />;
}

describe("PomodoroTimer settings editing", () => {
  it("keeps the typed value when a stale state-loaded reply arrives mid-edit", async () => {
    const user = userEvent.setup();
    const emitterRef: React.MutableRefObject<ReturnType<typeof useEventContext>["addEvent"] | null> = {
      current: null,
    };

    await act(async () => {
      render(
        <EventProvider>
          <HarnessWithEmitter emitterRef={emitterRef} />
        </EventProvider>
      );
    });

    await waitFor(() => expect(screen.getByLabelText("Configuración del temporizador")).toBeTruthy());
    await user.click(screen.getByLabelText("Configuración del temporizador"));

    const workInput = (await screen.findByLabelText("Trabajo (minutos)")) as HTMLInputElement;
    await user.clear(workInput);
    await user.type(workInput, "42");
    expect(workInput.value).toBe("42");

    await act(async () => {
      emitterRef.current!("pomodoro_state_loaded", {
        chat_id: "chat-1",
        chat_type: "private",
        timer_id: "timer-1",
        config: {
          work_duration: 25,
          short_break_duration: 5,
          long_break_duration: 15,
          cycles_before_long_break: 4,
        },
        state: {
          mode: "work",
          is_running: false,
          started_at: null,
          paused_at: null,
          time_left: 1500,
          cycles_completed: 0,
          has_pending_work_half_cycle: false,
          settings: {
            work_duration: 25,
            short_break_duration: 5,
            long_break_duration: 15,
            cycles_before_long_break: 4,
          },
          last_updated: Date.now(),
        },
      });
    });

    expect(workInput.value).toBe("42");
  });
});

describe("PomodoroTimer accessibility", () => {
  it("has no accessibility violations while loading", async () => {
    const { container } = render(
      <EventProvider>
        <PomodoroTimer chatId="chat-1" chatType="private" />
      </EventProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations once the timer settings load", async () => {
    let container: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <EventProvider>
          <HarnessLoaded />
        </EventProvider>
      ));
    });

    await waitFor(() => expect(container.querySelector("button")).not.toBeNull());

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
