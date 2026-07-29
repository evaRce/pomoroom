export interface LiveViewHook {
  el: Element;
  pushEventTo(el: Element, event: string, payload: object): void;
  handleEvent<T = unknown>(event: string, callback: (payload: T) => void): void;
}

export type FormErrors = Record<string, string>;
