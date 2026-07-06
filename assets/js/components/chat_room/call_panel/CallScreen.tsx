import React, { useEffect, useRef, useState } from "react";
import { Button, Tooltip, message } from "antd";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  X,
  ScreenShare,
  ScreenShareOff,
  Maximize2,
} from "lucide-react";
import { useLocalParticipant, useParticipants, useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import type { Participant, TrackPublication } from "livekit-client";
import callText from "./callText";

interface CallScreenProps {
  roomName: string;
  connectedAt: number | null;
  avatarByNickname: Record<string, string>;
  onEndCall: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function initials(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

function ParticipantTile({
  participant,
  isLocal,
  avatarUrl,
  hasVideo,
  videoTrackRef,
  isMuted,
  className = "",
}: {
  participant: Participant;
  isLocal: boolean;
  avatarUrl?: string;
  hasVideo: boolean;
  videoTrackRef: any;
  isMuted: boolean;
  className?: string;
}) {
  const displayName = isLocal ? callText.screen.you : participant.name || participant.identity;

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}
    >
      {hasVideo && videoTrackRef ? (
        <>
          <VideoTrack trackRef={videoTrackRef} className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded bg-black/55 px-2 py-0.5 text-xs text-white">
            {displayName}
          </span>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2">
          <div className="flex aspect-square w-[42%] min-w-[32px] max-w-[80px] items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-gray-500">{initials(displayName)}</span>
            )}
          </div>
          <span className="max-w-full truncate text-sm font-medium text-gray-700">{displayName}</span>
        </div>
      )}
      {isMuted && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55">
          <MicOff className="h-3.5 w-3.5 text-white" />
        </span>
      )}
    </div>
  );
}

const MIN_TILE_PX = 110;
const GRID_GAP_PX = 16;

function ParticipantGrid({
  participants,
  renderTile,
}: {
  participants: Participant[];
  renderTile: (participant: Participant, className: string) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const count = participants.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [count >= 3]);

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="aspect-square h-[70%] max-w-[70%]">
          {renderTile(participants[0], "h-full w-full")}
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-[5%]">
        {participants.map((participant) => (
          <div key={participant.identity} className="aspect-square h-[80%] w-[40%]">
            {renderTile(participant, "h-full w-full")}
          </div>
        ))}
      </div>
    );
  }

  const fitColumns = Math.floor((size.width + GRID_GAP_PX) / (MIN_TILE_PX + GRID_GAP_PX));
  const fitRows = Math.floor((size.height + GRID_GAP_PX) / (MIN_TILE_PX + GRID_GAP_PX));
  const hasMeasured = size.width > 0 && size.height > 0;
  const maxVisible = hasMeasured ? Math.max(fitColumns, 1) * Math.max(fitRows, 1) : count;
  const hasOverflow = hasMeasured && count > maxVisible;

  const visibleParticipants = hasOverflow
    ? participants.slice(0, Math.max(maxVisible - 1, 1))
    : participants;
  const overflowCount = count - visibleParticipants.length;

  const columns = hasOverflow ? Math.max(fitColumns, 1) : Math.ceil(Math.sqrt(count));

  return (
    <div
      ref={containerRef}
      className="grid h-full w-full gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(${MIN_TILE_PX}px, 1fr))`,
        gridAutoRows: "1fr",
      }}
    >
      {visibleParticipants.map((participant) => renderTile(participant, "h-full w-full"))}
      {hasOverflow && (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-600">
          <span className="text-lg font-semibold">+{overflowCount}</span>
          <span className="text-xs">{callText.screen.overflowUnit(overflowCount)}</span>
        </div>
      )}
    </div>
  );
}

export default function CallScreen({
  roomName,
  connectedAt,
  avatarByNickname,
  onEndCall,
  onClose,
}: CallScreenProps) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const trackRefs = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: true },
  ]);
  const screenShareTrackRefs = useTracks([Track.Source.ScreenShare]);
  const screenShareTrackRef = screenShareTrackRefs[0];
  const isSomeoneElseSharing = screenShareTrackRefs.some((t) => !t.participant.isLocal);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!connectedAt) {
      setDuration(0);
      return;
    }
    const tick = () => setDuration(Math.floor((Date.now() - connectedAt) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [connectedAt]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!screenShareTrackRef && document.fullscreenElement === containerRef.current) {
      document.exitFullscreen().catch(() => { });
    }
  }, [screenShareTrackRef]);

  useEffect(() => {
    if (!isScreenShareEnabled) return;

    const localVersion = screenShareTrackRef?.publication?.trackInfo?.version?.unixMicro;
    if (localVersion === undefined) return;

    const publishedEarlier = screenShareTrackRefs.some((t) => {
      if (t.participant.isLocal) return false;
      const remoteVersion = t.publication?.trackInfo?.version?.unixMicro;
      return remoteVersion !== undefined && remoteVersion < localVersion;
    });

    if (publishedEarlier) {
      void localParticipant.setScreenShareEnabled(false);
      message.warning(callText.screen.screenShareConflict);
    }
  }, [screenShareTrackRefs, screenShareTrackRef, isScreenShareEnabled, localParticipant]);

  const enterFullscreen = () => {
    containerRef.current?.requestFullscreen().catch(() => { });
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
  };

  const findTrack = (nickname: string, source: Track.Source) =>
    trackRefs.find((t) => t.participant.identity === nickname && t.source === source);

  const isPublicationActive = (publication: TrackPublication | undefined) =>
    !!publication && !publication.isMuted;

  const renderTile = (participant: Participant, className: string) => {
    const cameraRef = findTrack(participant.identity, Track.Source.Camera);
    const micRef = findTrack(participant.identity, Track.Source.Microphone);
    const hasVideo = isPublicationActive(cameraRef?.publication);
    const isMuted = !isPublicationActive(micRef?.publication);

    return (
      <ParticipantTile
        key={participant.identity}
        participant={participant}
        isLocal={participant.isLocal}
        avatarUrl={avatarByNickname[participant.identity]}
        hasVideo={hasVideo}
        videoTrackRef={cameraRef}
        isMuted={isMuted}
        className={className}
      />
    );
  };

  const screenShareToggleTitle = isScreenShareEnabled
    ? callText.screen.stopScreenShare
    : isSomeoneElseSharing
      ? callText.screen.screenShareBlocked
      : callText.screen.startScreenShare;

  const micButton = (
    <Button
      type="text"
      shape="circle"
      size="large"
      className={isMicrophoneEnabled ? "!bg-gray-100 !text-gray-700" : "!bg-red-50 !text-red-600"}
      icon={isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
      title={isMicrophoneEnabled ? callText.screen.muteMic : callText.screen.unmuteMic}
    />
  );

  const cameraButton = (
    <Button
      type="text"
      shape="circle"
      size="large"
      className={isCameraEnabled ? "!bg-gray-100 !text-gray-700" : "!bg-red-50 !text-red-600"}
      icon={isCameraEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
      title={isCameraEnabled ? callText.screen.turnOffCamera : callText.screen.turnOnCamera}
    />
  );

  const screenShareButton = (
    <Tooltip title={isSomeoneElseSharing && !isScreenShareEnabled ? screenShareToggleTitle : ""}>
      <span>
        <Button
          type="text"
          shape="circle"
          size="large"
          disabled={isSomeoneElseSharing && !isScreenShareEnabled}
          className={isScreenShareEnabled ? "!bg-orange-50 !text-brand" : "!bg-gray-100 !text-gray-700"}
          icon={
            isScreenShareEnabled ? (
              <ScreenShareOff className="h-5 w-5" />
            ) : (
              <ScreenShare className="h-5 w-5" />
            )
          }
          onClick={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
          title={screenShareToggleTitle}
        />
      </span>
    </Tooltip>
  );

  const hangupButton = (
    <Button
      type="primary"
      danger
      shape="circle"
      size="large"
      icon={<PhoneOff className="h-5 w-5" />}
      onClick={onEndCall}
      title={callText.screen.endCall}
    />
  );

  if (isFullscreen && screenShareTrackRef) {
    return (
      <div ref={containerRef} className="flex h-full min-h-0 flex-col bg-black">
        <div className="flex shrink-0 items-center justify-end px-4 py-3">
          <Button
            type="text"
            shape="circle"
            className="!text-gray-300 hover:!bg-white/10"
            icon={<X className="h-5 w-5" />}
            onClick={exitFullscreen}
            title={callText.screen.exitFullscreen}
          />
        </div>
        <div className="min-h-0 flex-1 px-4 pb-2">
          <VideoTrack trackRef={screenShareTrackRef} className="h-full w-full object-contain" />
        </div>
        <div className="flex shrink-0 items-center justify-center gap-4 py-5">
          {micButton}
          {cameraButton}
          {hangupButton}
          <Button
            type="text"
            shape="circle"
            size="large"
            className="!bg-orange-50 !text-brand"
            icon={<ScreenShareOff className="h-5 w-5" />}
            onClick={() => localParticipant.setScreenShareEnabled(false)}
            title={callText.screen.stopScreenShare}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-col bg-gray-50">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{callText.screen.roomTitle(roomName)}</span>
          <span className="text-xs text-gray-500">
            {callText.screen.participantsCount(participants.length)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-sm text-gray-500">{formatDuration(duration)}</span>
          </div>
          {screenShareTrackRef && (
            <Button
              type="text"
              shape="circle"
              className="!text-gray-500 hover:!bg-gray-100"
              icon={<Maximize2 className="h-4 w-4" />}
              onClick={enterFullscreen}
              title={callText.screen.enterFullscreen}
            />
          )}
          <Button
            type="text"
            shape="circle"
            className="!text-gray-500 hover:!bg-gray-100"
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
            title={callText.screen.close}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-4">
        {screenShareTrackRef && (
          <div className="relative min-h-0 flex-[3] overflow-hidden rounded-xl bg-black">
            <VideoTrack trackRef={screenShareTrackRef} className="h-full w-full object-contain" />
          </div>
        )}

        <div className={`min-h-0 ${screenShareTrackRef ? "flex-[2]" : "flex-1"}`}>
          <ParticipantGrid participants={participants} renderTile={renderTile} />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4 border-t border-gray-200 bg-white py-5">
        {micButton}
        {cameraButton}
        {screenShareButton}
        {hangupButton}
      </div>
    </div>
  );
}