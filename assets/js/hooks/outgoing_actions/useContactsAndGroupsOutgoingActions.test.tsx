import React from "react";
import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventProvider, useEventContext } from "../../components/chat_room/EventContext";
import { useContactsAndGroupsOutgoingActions } from "./useContactsAndGroupsOutgoingActions";
import * as pomodoroTimerStore from "../../components/chat_room/pomodoro_timer/pomodoroTimerStore";
import * as pomodoroNotificationStore from "../../components/chat_room/pomodoro_timer/pomodoroNotificationStore";

function setup(overrides: Partial<Parameters<typeof useContactsAndGroupsOutgoingActions>[0]> = {}) {
  const pushEventToLiveView = vi.fn();
  const setIsVisibleDetail = vi.fn();
  const setInfoChatSelected = vi.fn();
  const setComponent = vi.fn();

  const { result } = renderHook(
    () => {
      const { addEvent, removeEvent } = useEventContext();
      useContactsAndGroupsOutgoingActions({
        removeEvent,
        pushEventToLiveView,
        infoChatSelected: {},
        isVisibleDetail: false,
        setIsVisibleDetail,
        setInfoChatSelected,
        setComponent,
        ...overrides,
      });
      return { addEvent };
    },
    { wrapper: ({ children }) => <EventProvider>{children}</EventProvider> }
  );

  return { result, pushEventToLiveView, setIsVisibleDetail, setInfoChatSelected, setComponent };
}

describe("useContactsAndGroupsOutgoingActions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pushes the delete_contact action to the LiveView", () => {
    const { result, pushEventToLiveView } = setup();

    act(() => {
      result.current.addEvent("delete_contact", "bob01");
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.delete_contact", "bob01");
  });

  it("clears the detail panel when the deleted contact is currently selected", () => {
    const { result, setComponent, setInfoChatSelected } = setup({
      infoChatSelected: { contact_name: "bob01" },
      isVisibleDetail: true,
    });

    act(() => {
      result.current.addEvent("delete_contact", "bob01");
    });

    expect(setComponent).toHaveBeenCalledWith("");
    expect(setInfoChatSelected).toHaveBeenCalledWith({});
  });

  it("selects a private chat and pushes the action", () => {
    const { result, pushEventToLiveView, setInfoChatSelected } = setup();

    act(() => {
      result.current.addEvent("selected_private_chat", { contact_name: "alice" });
    });

    expect(setInfoChatSelected).toHaveBeenCalledWith({ contact_name: "alice" });
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.selected_private_chat", {
      contact_name: "alice",
    });
  });

  it("requests group members when toggling visibility on for a group", () => {
    const { result, pushEventToLiveView, setIsVisibleDetail } = setup();

    const payload = { is_visible: true, is_group: true, group_name: "team" };
    act(() => {
      result.current.addEvent("toggle_detail_visibility", payload);
    });

    expect(setIsVisibleDetail).toHaveBeenCalledWith(true);
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.get_members", payload);
  });

  it("does not request members when toggling visibility off", () => {
    const { result, pushEventToLiveView, setIsVisibleDetail } = setup();

    act(() => {
      result.current.addEvent("toggle_detail_visibility", {
        is_visible: false,
        is_group: true,
        group_name: "team",
      });
    });

    expect(setIsVisibleDetail).toHaveBeenCalledWith(false);
    expect(pushEventToLiveView).not.toHaveBeenCalledWith("action.get_members", expect.anything());
  });

  it("clears timers and notifications and pushes logout", () => {
    const clearAllTimersSpy = vi.spyOn(pomodoroTimerStore, "clearAllTimers");
    const clearRequestedConfigsSpy = vi.spyOn(pomodoroTimerStore, "clearRequestedConfigs");
    const clearAllPomodoroNotificationsSpy = vi.spyOn(
      pomodoroNotificationStore,
      "clearAllPomodoroNotifications"
    );
    const { result, pushEventToLiveView } = setup();

    act(() => {
      result.current.addEvent("logout", true);
    });

    expect(clearAllTimersSpy).toHaveBeenCalled();
    expect(clearRequestedConfigsSpy).toHaveBeenCalled();
    expect(clearAllPomodoroNotificationsSpy).toHaveBeenCalled();
    expect(pushEventToLiveView).toHaveBeenCalledWith("action.logout", {});
  });

  it("pushes the locale change with the selected locale", () => {
    const { result, pushEventToLiveView } = setup();

    act(() => {
      result.current.addEvent("set_locale", "es");
    });

    expect(pushEventToLiveView).toHaveBeenCalledWith("action.set_locale", { locale: "es" });
  });
});
