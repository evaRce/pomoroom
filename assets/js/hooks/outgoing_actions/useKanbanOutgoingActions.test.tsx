import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { useKanbanOutgoingActions } from "./useKanbanOutgoingActions";

function setup() {
  const pushEventToLiveView = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      useKanbanOutgoingActions({ removeEvent, pushEventToLiveView });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView };
}

describe("useKanbanOutgoingActions", () => {
  const cases: Array<[string, string, Record<string, unknown>]> = [
    ["get_kanban_board", "action.get_kanban_board", { chat_id: "c1", chat_type: "group" }],
    ["add_kanban_column", "action.add_kanban_column", { chat_id: "c1", chat_type: "group", title: "To do" }],
    [
      "rename_kanban_column",
      "action.rename_kanban_column",
      { chat_id: "c1", chat_type: "group", column_id: "col1", title: "Doing" },
    ],
    [
      "remove_kanban_column",
      "action.remove_kanban_column",
      { chat_id: "c1", chat_type: "group", column_id: "col1" },
    ],
    [
      "add_kanban_task",
      "action.add_kanban_task",
      { chat_id: "c1", chat_type: "group", column_id: "col1", title: "Task" },
    ],
    [
      "move_kanban_task",
      "action.move_kanban_task",
      {
        chat_id: "c1",
        chat_type: "group",
        task_id: "t1",
        from_column_id: "col1",
        to_column_id: "col2",
        new_position: 0,
      },
    ],
    [
      "reorder_kanban_task",
      "action.reorder_kanban_task",
      { chat_id: "c1", chat_type: "group", task_id: "t1", column_id: "col1", new_position: 1 },
    ],
    [
      "rename_kanban_task",
      "action.rename_kanban_task",
      { chat_id: "c1", chat_type: "group", task_id: "t1", title: "New title" },
    ],
    [
      "delete_kanban_task",
      "action.delete_kanban_task",
      { chat_id: "c1", chat_type: "group", task_id: "t1" },
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
