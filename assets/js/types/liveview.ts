export interface LiveViewHook {
  el: Element;
  pushEventTo(el: Element, event: string, payload: object): void;
  handleEvent(event: string, callback: (payload: any) => void): void;
}

export type FormErrors = Record<string, string>;
