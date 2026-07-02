import React, { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Button, Modal } from "antd";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from "lucide-react";
import { useEventContext, useEvent } from "../EventContext";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Appends a signal to the outgoing queue to prevent rapid signals from overwriting each other.
function enqueueSignal(addEvent: (name: string, data: any) => void, payload: object) {
  addEvent("signals", (prev: any[] | undefined) => [...(prev ?? []), payload]);
}

export default function CallPanel({ chatName, userLogin }) {
  const { addEvent, removeEvent } = useEventContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideosRef = useRef<Record<string, HTMLVideoElement>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingCandidates = useRef<Record<string, RTCIceCandidate[]>>({});
  const inRoomRef = useRef(false);

  const roomUsersEvent = useEvent("room_users");
  const sdpOfferEvent = useEvent("sdp_offer");
  const sdpAnswerEvent = useEvent("sdp_answer");
  const iceCandidatesEvent = useEvent("ice_candidates");

  // Keep inRoomRef in sync to avoid stale closures inside async effects.
  useEffect(() => { inRoomRef.current = inRoom; }, [inRoom]);

  // Assigns srcObject as soon as the local <video> mounts (Ant Design Modal renders lazily).
  const setLocalVideoRef = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  }, []);


  // Closes connections for users who left; creates offers for newly joined users.
  // Glare prevention: only the lexicographically greater nickname sends the offer.
  useEffect(() => {
    if (!roomUsersEvent) return;
    const newUsers: string[] = roomUsersEvent.room_users;
    const myNickname = userLogin.nickname;

    Object.keys(peersRef.current).forEach((nick) => {
      if (!newUsers.includes(nick)) {
        peersRef.current[nick]?.close();
        delete peersRef.current[nick];
        delete pendingCandidates.current[nick];
        delete remoteStreamsRef.current[nick];
      }
    });

    if (inRoomRef.current) {
      newUsers.forEach((nick) => {
        if (nick !== myNickname && !peersRef.current[nick] && myNickname > nick) {
          createOffer(nick);
        }
      });
    }

    setRoomUsers(newUsers.filter((u) => u !== myNickname));
    removeEvent("room_users");
  }, [roomUsersEvent]);

  // Handles an incoming SDP offer; reuses the existing peer connection to support renegotiation.
  useEffect(() => {
    if (!sdpOfferEvent) return;
    const { from_user, description } = sdpOfferEvent;
    handleOffer(from_user, description);
    removeEvent("sdp_offer");
  }, [sdpOfferEvent]);

  // Sets the remote description from an incoming SDP answer, then flushes pending ICE candidates.
  useEffect(() => {
    if (!sdpAnswerEvent) return;
    const { from_user, description } = sdpAnswerEvent;
    const pc = peersRef.current[from_user];
    if (pc) pc.setRemoteDescription(description).then(() => flushCandidates(from_user));
    removeEvent("sdp_answer");
  }, [sdpAnswerEvent]);

  // Processes all queued ICE candidates at once (queue prevents overwrites between renders).
  useEffect(() => {
    if (!iceCandidatesEvent?.length) return;
    iceCandidatesEvent.forEach(({ from_user, candidate }: any) => {
      const pc = peersRef.current[from_user];
      if (pc?.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidates.current[from_user] ??= [];
        pendingCandidates.current[from_user].push(new RTCIceCandidate(candidate));
      }
    });
    removeEvent("ice_candidates");
  }, [iceCandidatesEvent]);

  // Creates a new RTCPeerConnection with local tracks, ICE, track, and connection-state handlers.
  const buildPeerConnection = (remoteNick: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[remoteNick] = pc;

    localStreamRef.current?.getTracks().forEach((t) =>
      pc.addTrack(t, localStreamRef.current!)
    );

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        enqueueSignal(addEvent, {
          to_user: remoteNick,
          signal_type: "ice_candidate",
          candidate,
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      remoteStreamsRef.current[remoteNick] = streams[0];
      const videoEl = remoteVideosRef.current[remoteNick];
      if (videoEl) {
        videoEl.srcObject = streams[0];
        videoEl.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.info(`[WebRTC] ${remoteNick}: ${state}`);
      if (state === "failed") {
        pc.restartIce();
        createOffer(remoteNick);
      }
    };

    return pc;
  };

  const createOffer = async (remoteNick: string) => {
    const pc = peersRef.current[remoteNick] ?? buildPeerConnection(remoteNick);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    enqueueSignal(addEvent, {
      to_user: remoteNick,
      signal_type: "sdp_offer",
      description: pc.localDescription,
    });
  };

  const handleOffer = async (remoteNick: string, description: RTCSessionDescriptionInit) => {
    const pc = peersRef.current[remoteNick] ?? buildPeerConnection(remoteNick);
    await pc.setRemoteDescription(description);
    await flushCandidates(remoteNick);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    enqueueSignal(addEvent, {
      to_user: remoteNick,
      signal_type: "sdp_answer",
      description: pc.localDescription,
    });
  };

  const flushCandidates = async (nick: string) => {
    const pc = peersRef.current[nick];
    const queued = pendingCandidates.current[nick] ?? [];
    for (const c of queued) await pc?.addIceCandidate(c).catch(() => {});
    pendingCandidates.current[nick] = [];
  };

  // Acquires media before joining so localStreamRef is populated when peer connections are built.
  const enterRoom = async () => {
    flushSync(() => {
      setInRoom(true);
      setModalVisible(true);
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("[WebRTC] getUserMedia not available — HTTPS is required on non-localhost origins.");
    } else {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" } },
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (e) {
          console.error("No media access:", e);
        }
      }

      if (stream) {
        stream.getVideoTracks().forEach((t) => { t.enabled = false; });
        localStreamRef.current = stream;
        setIsVideoEnabled(false);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
    }

    addEvent("join_room", { contact_name: chatName });
  };

  const leaveRoom = () => {
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    pendingCandidates.current = {};
    remoteStreamsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setInRoom(false);
    setRoomUsers([]);
    setModalVisible(false);
    setIsVideoEnabled(false);
    addEvent("leave_room", {});
  };

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((p) => !p);
  };

  // Toggles camera; if no video track exists yet, acquires one and renegotiates with all peers.
  const toggleVideo = async () => {
    const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];

    if (videoTracks.length > 0) {
      const newEnabled = !videoTracks[0].enabled;
      videoTracks.forEach((t) => { t.enabled = newEnabled; });
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsVideoEnabled(newEnabled);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("[WebRTC] getUserMedia not available — HTTPS required.");
      return;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
      });
      const [videoTrack] = videoStream.getVideoTracks();
      const existingTracks = localStreamRef.current?.getTracks() ?? [];
      const newStream = new MediaStream([...existingTracks, videoTrack]);
      localStreamRef.current = newStream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      setIsVideoEnabled(true);

      for (const [nick, pc] of Object.entries(peersRef.current)) {
        pc.addTrack(videoTrack, newStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        enqueueSignal(addEvent, {
          to_user: nick,
          signal_type: "sdp_offer",
          description: pc.localDescription,
        });
      }
    } catch (e) {
      console.error("Camera access denied:", e);
    }
  };

  return (
    <div>
      <Button
        type="text"
        className={`!h-9 !w-9 !rounded-lg ${inRoom ? "!bg-green-50 !text-green-600" : "text-gray-600 hover:!bg-gray-100"}`}
        icon={<Phone className="h-[18px] w-[18px]" />}
        title={inRoom ? "Mostrar sala" : "Entrar a la sala"}
        onClick={inRoom ? () => setModalVisible(true) : enterRoom}
      />

      <Modal
        open={modalVisible}
        title={`Sala con ${chatName}`}
        centered
        onCancel={() => setModalVisible(false)}
        width="min(520px, 92vw)"
        styles={{ body: { padding: 0 } }}
        footer={
          <div className="flex flex-wrap items-center justify-center gap-4 py-2 overflow-visible">
            <Button
              type="text"
              className={`!h-12 !w-12 !rounded-full !p-0 inline-flex items-center justify-center ${
                isMuted ? "!bg-red-500 !text-white" : "!bg-gray-700 !text-gray-200"
              }`}
              onClick={toggleAudio}
              title={isMuted ? "Activar audio" : "Silenciar"}
              icon={isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            />
            <Button
              type="text"
              className={`!h-12 !w-12 !rounded-full !p-0 inline-flex items-center justify-center ${
                !isVideoEnabled ? "!bg-red-500 !text-white" : "!bg-gray-700 !text-gray-200"
              }`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Desactivar cámara" : "Activar cámara"}
              icon={isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            />
            <Button
              type="text"
              className="!h-12 !w-12 !rounded-full !p-0 inline-flex items-center justify-center !bg-red-500 !text-white"
              onClick={leaveRoom}
              title="Salir de la sala"
              icon={<PhoneOff className="h-5 w-5" />}
            />
          </div>
        }
      >
        <div className={`grid gap-3 p-3 ${roomUsers.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="relative">
            <p className="text-xs text-center text-gray-500 mb-1">Tú</p>
            <video
              ref={setLocalVideoRef}
              playsInline
              autoPlay
              muted
              className="w-full aspect-video object-cover rounded-lg bg-gray-800"
              style={{ transform: "rotateY(180deg)" }}
            />
          </div>
          {roomUsers.map((nick) => (
            <div key={nick} className="relative">
              <p className="text-xs text-center text-gray-500 mb-1">{nick}</p>
              <video
                playsInline
                autoPlay
                ref={(el) => {
                  if (el) {
                    remoteVideosRef.current[nick] = el;
                    if (remoteStreamsRef.current[nick]) {
                      el.srcObject = remoteStreamsRef.current[nick];
                      el.play().catch(() => {});
                    }
                  }
                }}
                className="w-full aspect-video object-cover rounded-lg bg-gray-800"
                style={{ transform: "rotateY(180deg)" }}
              />
            </div>
          ))}
        </div>
        {roomUsers.length === 0 && (
          <p className="text-center text-gray-400 text-sm px-4 pb-3">
            Esperando a que {chatName} entre a la sala...
          </p>
        )}
      </Modal>
    </div>
  );
}