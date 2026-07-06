import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { ConnectionError, ConnectionErrorReason, DisconnectReason, Room, RoomEvent } from "livekit-client";
import { RoomContext, RoomAudioRenderer } from "@livekit/components-react";
import { useEventContext, useEvent } from "../EventContext";
import callText from "./callText";

interface CallContextValue {
  activeCallChatId: string | null;
  activeCallRoomName: string;
  activeCallIsGroupChat: boolean;
  connectingChatId: string | null;
  connectedAt: number | null;
  isMinimized: boolean;
  setMinimized: (minimized: boolean) => void;
  viewingChatId: string | null;
  setViewingChatId: (chatId: string | null) => void;
  joinCall: (chatId: string, chatName: string, isGroupChat: boolean) => void;
  leaveCall: () => void;
}

const CallContext = createContext<CallContextValue>({
  activeCallChatId: null,
  activeCallRoomName: "",
  activeCallIsGroupChat: false,
  connectingChatId: null,
  connectedAt: null,
  isMinimized: false,
  setMinimized: () => { },
  viewingChatId: null,
  setViewingChatId: () => { },
  joinCall: () => { },
  leaveCall: () => { },
});

export const useCallContext = () => useContext(CallContext);

// Owns the LiveKit Room instance at the ChatRoom root so the connection
// (and audio) survives navigating between chats, while CallScreen/CallButton
// (mounted deeper in the tree) drive it purely through this context.
export function CallSessionProvider({ children }: { children: React.ReactNode }) {
  const { addEvent, removeEvent } = useEventContext();
  const livekitTokenEvent = useEvent("livekit_token");
  const callRoomNameEvent = useEvent("call_room_name");
  const room = useMemo(() => new Room(), []);
  const connectingChatIdRef = useRef<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [connectingChatId, setConnectingChatId] = useState<string | null>(null);
  const [isMinimized, setMinimized] = useState(false);
  const [viewingChatId, setViewingChatId] = useState<string | null>(null);

  useEffect(() => {
    const handleConnected = () => {
      setConnectedAt(Date.now());
      setConnectingChatId(null);
    };
    const handleDisconnected = (reason?: DisconnectReason) => {
      connectingChatIdRef.current = null;
      setConnectedAt(null);
      setConnectingChatId(null);
      setMinimized(false);
      removeEvent("livekit_token");
      removeEvent("call_room_name");

      if (reason !== undefined && reason !== DisconnectReason.CLIENT_INITIATED) {
        message.error(callText.connection.callDropped);
      }
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, removeEvent]);

  useEffect(() => {
    if (!livekitTokenEvent) return;
    if (livekitTokenEvent.chat_id !== connectingChatId) return;
    if (connectingChatIdRef.current === livekitTokenEvent.chat_id) return;

    connectingChatIdRef.current = livekitTokenEvent.chat_id;
    room.connect(livekitTokenEvent.ws_url, livekitTokenEvent.token).catch((error) => {
      connectingChatIdRef.current = null;
      setConnectingChatId(null);

      if (!(error instanceof ConnectionError) || error.reason !== ConnectionErrorReason.Cancelled) {
        const errorMessage =
          error instanceof ConnectionError && error.reason === ConnectionErrorReason.NotAllowed
            ? callText.connection.joinNotAllowed
            : error instanceof ConnectionError &&
              (error.reason === ConnectionErrorReason.ServerUnreachable ||
                error.reason === ConnectionErrorReason.WebSocket ||
                error.reason === ConnectionErrorReason.Timeout)
              ? callText.connection.joinUnreachable
              : callText.connection.joinFailed;
        message.error(errorMessage);
      }

      removeEvent("livekit_token");
      removeEvent("call_room_name");
    });
  }, [livekitTokenEvent, connectingChatId, room, removeEvent]);

  const joinCall = (chatId: string, chatName: string, isGroupChat: boolean) => {
    if (livekitTokenEvent?.chat_id || connectingChatId) return;

    setConnectingChatId(chatId);
    addEvent("call_room_name", { chat_id: chatId, name: chatName, is_group: isGroupChat });
    addEvent("join_room", { chat_id: chatId });
  };

  const leaveCall = () => {
    room.disconnect();
  };

  useEffect(() => {
    return () => {
      room.disconnect();
    };
  }, [room]);

  const isCallRoomNameCurrent = callRoomNameEvent?.chat_id === livekitTokenEvent?.chat_id;
  const roomName = isCallRoomNameCurrent ? callRoomNameEvent?.name || "" : "";
  const roomIsGroup = isCallRoomNameCurrent ? Boolean(callRoomNameEvent?.is_group) : false;

  const value: CallContextValue = {
    activeCallChatId: livekitTokenEvent?.chat_id ?? null,
    activeCallRoomName: roomName,
    activeCallIsGroupChat: roomIsGroup,
    connectingChatId,
    connectedAt,
    isMinimized,
    setMinimized,
    viewingChatId,
    setViewingChatId,
    joinCall,
    leaveCall,
  };

  return (
    <RoomContext.Provider value={room}>
      <CallContext.Provider value={value}>
        {children}
        {livekitTokenEvent && <RoomAudioRenderer />}
      </CallContext.Provider>
    </RoomContext.Provider>
  );
}
