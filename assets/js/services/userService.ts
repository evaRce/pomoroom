import { LiveViewHook } from "../types/liveview";

type AddEvent = (eventName: string, eventData: any) => void;

export function saveUserAction(
  hook: LiveViewHook,
  email: string,
  password: string,
  nickname: string
): void {
  hook.pushEventTo(hook.el, "action.save_user", { email, password, nickname });
}

export function loginUserAction(
  hook: LiveViewHook,
  email: string,
  password: string
): void {
  hook.pushEventTo(hook.el, "action.log_user", { email, password });
}

export function logoutAction(addEvent: AddEvent): void {
  addEvent("logout", true);
}
