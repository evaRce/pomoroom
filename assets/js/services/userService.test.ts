import { describe, expect, it, vi } from "vitest";
import { loginUserAction, logoutAction, saveUserAction, setLocaleAction } from "./userService";
import type { LiveViewHook } from "../types/liveview";

function createHook() {
  return {
    el: document.createElement("div"),
    pushEventTo: vi.fn(),
    handleEvent: vi.fn(),
  } satisfies LiveViewHook;
}

describe("saveUserAction", () => {
  it("pushes action.save_user with the signup form data", () => {
    const hook = createHook();

    saveUserAction(hook, "eva@example.com", "secret123", "secret123", "eva01");

    expect(hook.pushEventTo).toHaveBeenCalledWith(hook.el, "action.save_user", {
      email: "eva@example.com",
      password: "secret123",
      password_confirmation: "secret123",
      nickname: "eva01",
    });
  });
});

describe("loginUserAction", () => {
  it("pushes action.log_user with the login credentials", () => {
    const hook = createHook();

    loginUserAction(hook, "eva@example.com", "secret123");

    expect(hook.pushEventTo).toHaveBeenCalledWith(hook.el, "action.log_user", {
      email: "eva@example.com",
      password: "secret123",
    });
  });
});

describe("logoutAction", () => {
  it("emits a logout event", () => {
    const addEvent = vi.fn();

    logoutAction(addEvent);

    expect(addEvent).toHaveBeenCalledWith("logout", true);
  });
});

describe("setLocaleAction", () => {
  it("emits set_locale with the chosen locale", () => {
    const addEvent = vi.fn();

    setLocaleAction(addEvent, "en");

    expect(addEvent).toHaveBeenCalledWith("set_locale", "en");
  });
});
