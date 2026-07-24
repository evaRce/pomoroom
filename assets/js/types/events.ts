// Contrato de payloads para los eventos del bus interno (EventContext).
// Cada entrada aquí es la única fuente de verdad para ese evento: tanto quien
// lo emite (addEvent) como quien lo consume (useEvent) quedan atados a la
// misma forma. Los eventos que todavía no están mapeados aquí siguen
// resolviendo a `any`, para poder migrarlos de forma incremental.
export interface EventBusPayloads {
  join_room: { chat_id: string };
  call_room_name: { chat_id: string; name: string; is_group: boolean };
  livekit_token: { token: string; ws_url: string; chat_id: string };
}

export type EventBusPayload<K extends string> = K extends keyof EventBusPayloads
  ? EventBusPayloads[K]
  : any;

export type AddEvent = <K extends string>(
  eventName: K,
  eventData: EventBusPayload<K> | ((prev: EventBusPayload<K>) => EventBusPayload<K>)
) => void;

export type RemoveEvent = (eventName: string) => void;

// Contrato de payloads para las acciones emitidas hacia el servidor LiveView
// vía pushEventToLiveView. Igual que arriba: las acciones no migradas
// resuelven a `object` (comportamiento actual) hasta que se tipen.
export interface OutgoingActionPayloads {
  "action.join_room": { chat_id: string };
}

export type OutgoingActionPayload<K extends string> = K extends keyof OutgoingActionPayloads
  ? OutgoingActionPayloads[K]
  : object;

export type PushEventToLiveView = <K extends string>(
  event: K,
  payload: OutgoingActionPayload<K>
) => any;
