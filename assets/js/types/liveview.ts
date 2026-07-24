export interface LiveViewHook {
  el: Element;
  pushEventTo(el: Element, event: string, payload: object): void;
}

export type FormErrors = Record<string, string>;
