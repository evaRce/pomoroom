import React, { createContext, useState, useContext } from "react";

type EventContext = {
  eventsData: any,
  addEvent: (eventName: string, eventData: object) => void,
  getEventData: (eventName:string) => object,
  removeEvent: (eventName: string) => void
};

const EventContext = createContext({
  eventsData: {},
  addEvent: (eventName, eventData) => {},
  getEventData: (eventName) => {},
  removeEvent: (eventName) => {},
});

export const EventProvider = ({ children }) => {
  const [eventsData, setEventsData] = useState({});

  const addEvent = (eventName, eventData) => {
    setEventsData((prevEventsData) => ({
      ...prevEventsData,
      [eventName]: eventData,
    }));
  };

  const getEventData = (eventName) => {
    return eventsData[eventName];
  };

  const removeEvent = (eventName) => {
    setEventsData((prevEventsData) => {
      const newEventsData = { ...prevEventsData };
      delete newEventsData[eventName];
      return newEventsData;
    });
  };

  return (
    <EventContext.Provider value={{ eventsData, addEvent, getEventData, removeEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => useContext(EventContext);