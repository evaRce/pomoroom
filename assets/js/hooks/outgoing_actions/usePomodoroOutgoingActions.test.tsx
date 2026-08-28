import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { usePomodoroOutgoingActions } from "./usePomodoroOutgoingActions";

function setup() {
  const pushEventToLiveView = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      usePomodoroOutgoingActions({ removeEvent, pushEventToLiveView });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView };
}

describe("usePomodoroOutgoingActions", () => {
  const cases: Array<[string, string, Record<string, unknown>]> = [
    ["get_pomodoro_state", "action.get_pomodoro_state", { chat_id: "c1", chat_type: "group" }],
    [
      "update_pomodoro_plugin_config",
      "action.update_pomodoro_plugin_config",
      { timer_id: "t1", chat_id: "c1", chat_type: "group", config: {} },
    ],
    ["start_pomodoro_timer", "action.start_pomodoro_timer", { chat_id: "c1", chat_type: "group" }],
    ["pause_pomodoro_timer", "action.pause_pomodoro_timer", { chat_id: "c1", chat_type: "group" }],
    ["reset_pomodoro_timer", "action.reset_pomodoro_timer", { chat_id: "c1", chat_type: "group" }],
    [
      "set_pomodoro_timer_mode",
      "action.set_pomodoro_timer_mode",
      { chat_id: "c1", chat_type: "group", mode: "work" },
    ],
  ];

  it.each(cases)("pushes %s as %s", (incomingEvent, outgoingAction, payload) => {
    const { result, pushEventToLiveView } = setup();

    act(() => {
      result.current.addEvent(incomingEvent, payload);
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith(outgoingAction, payload);
  });
});
