import React, { createContext, useState, useContext, useCallback } from "react";

type EventsDataMap = Record<string, any>;

type EventContextType = {
  eventsData: EventsDataMap,
  addEvent: (eventName: string, eventData: any) => void,
  getEventData: (eventName:string) => any,
  removeEvent: (eventName: string) => void
};

const EventContext = createContext<EventContextType>({
  eventsData: {},
  addEvent: () => {},
  getEventData: () => {},
  removeEvent: () => {},
});

export const EventProvider = ({ children }) => {
  const [eventsData, setEventsData] = useState<EventsDataMap>({});

  const addEvent = useCallback((eventName: string, eventData: any) => {
    setEventsData((prevEventsData) => ({
      ...prevEventsData,
      [eventName]: eventData,
    }));
  }, []);

  const getEventData = (eventName: string) => {
    return eventsData[eventName];
  };

  const removeEvent = useCallback((eventName: string) => {
    setEventsData((prevEventsData) => {
      const newEventsData = { ...prevEventsData };
      delete newEventsData[eventName];
      return newEventsData;
    });
  }, []);

  return (
    <EventContext.Provider value={{ eventsData, addEvent, getEventData, removeEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => useContext(EventContext);

export const useEvent = (eventName: string) => {
  const { eventsData } = useEventContext();
  return eventsData[eventName];
};