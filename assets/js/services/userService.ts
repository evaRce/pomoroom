import { LiveViewHook } from "../types/liveview";

export function saveUser(
  hook: LiveViewHook,
  email: string,
  password: string,
  nickname: string
): void {
  hook.pushEventTo(hook.el, "action.save_user", { email, password, nickname });
}

export function loginUser(
  hook: LiveViewHook,
  email: string,
  password: string
): void {
  hook.pushEventTo(hook.el, "action.log_user", { email, password });
}
