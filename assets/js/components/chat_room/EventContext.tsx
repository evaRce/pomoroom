import React, { createContext, useState, useContext, useCallback } from "react";

type EventsDataMap = Record<string, any>;

type EventContextType = {
  eventsData: EventsDataMap,
  addEvent: (eventName: string, eventData: any) => void,
  removeEvent: (eventName: string) => void
};

const EventContext = createContext<EventContextType>({
  eventsData: {},
  addEvent: () => { },
  removeEvent: () => { },
});

export const EventProvider = ({ children }) => {
  const [eventsData, setEventsData] = useState<EventsDataMap>({});

  // Accepts a plain value or a functional updater (prev => newValue).
  // Functional updaters are used for queue-based events (e.g. ICE candidates)
  // where multiple rapid calls must accumulate rather than overwrite each other.
  const addEvent = useCallback((eventName: string, eventData: any) => {
    setEventsData((prevEventsData) => ({
      ...prevEventsData,
      [eventName]: typeof eventData === "function"
        ? eventData(prevEventsData[eventName])
        : eventData,
    }));
  }, []);

  const removeEvent = useCallback((eventName: string) => {
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

export const useEvent = (eventName: string) => {
  const { eventsData } = useEventContext();
  return eventsData[eventName];
};