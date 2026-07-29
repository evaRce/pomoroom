import React, { createContext, useState, useContext, useCallback } from "react";
import { AddEvent, EventBusPayload, RemoveEvent } from "../../types/events";

type EventsDataMap = Record<string, unknown>;

type EventContextType = {
  eventsData: EventsDataMap,
  addEvent: AddEvent,
  removeEvent: RemoveEvent
};

const EventContext = createContext<EventContextType>({
  eventsData: {},
  addEvent: () => { },
  removeEvent: () => { },
});

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [eventsData, setEventsData] = useState<EventsDataMap>({});

  // Accepts a plain value or a functional updater (prev => newValue).
  // Functional updaters are used for queue-based events (e.g. ICE candidates)
  // where multiple rapid calls must accumulate rather than overwrite each other.
  const addEvent: AddEvent = useCallback((eventName, eventData) => {
    setEventsData((prevEventsData) => ({
      ...prevEventsData,
      [eventName]: typeof eventData === "function"
        ? (eventData as (prev: unknown) => unknown)(prevEventsData[eventName])
        : eventData,
    }));
  }, []);

  const removeEvent: RemoveEvent = useCallback((eventName) => {
    setEventsData((prevEventsData) => {
      const newEventsData = { ...prevEventsData };
      delete newEventsData[eventName];
      return newEventsData;
    });
  }, []);

  return (
    <EventContext.Provider value={{ eventsData, addEvent, removeEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => useContext(EventContext);

export const useEvent = <K extends string>(eventName: K): EventBusPayload<K> => {
  const { eventsData } = useEventContext();
  return eventsData[eventName] as EventBusPayload<K>;
};