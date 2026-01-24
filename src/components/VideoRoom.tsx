"use client";

import { useState, useEffect, useRef } from "react";
import { connect, Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant } from "twilio-video";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface VideoRoomProps {
  roomName: string;
  identity: string;
}

export function VideoRoom({ roomName, identity }: VideoRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mountedRef = useRef(true);

  // Check if we're on mobile - mobile browsers require user gesture for permissions
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  async function joinRoom() {
    if (hasJoined) return; // Prevent double-joining
    
    setIsConnecting(true);
    setError(null);
    mountedRef.current = true;

    try {
      // Get access token from our API
      const response = await fetch("/api/twilio/video-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName,
          identity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get access token");
      }

      const { token } = await response.json();

      // Connect to the room - this will request camera/mic permissions
      const room = await connect(token, {
        name: roomName,
        audio: true,
        video: { width: 1280, height: 720 },
      });

      if (!mountedRef.current) {
        room.disconnect();
        return;
      }

      setRoom(room);
      setHasJoined(true);
      setIsConnecting(false);

      // Get local video track
      const localVideo = Array.from(room.localParticipant.videoTracks.values())[0]?.track;
      const localAudio = Array.from(room.localParticipant.audioTracks.values())[0]?.track;

      if (localVideo) {
        setLocalVideoTrack(localVideo);
      }
      if (localAudio) {
        setLocalAudioTrack(localAudio);
      }

      // Handle existing participants
      room.participants.forEach((participant) => {
        participantConnected(participant);
      });

      // Handle new participants joining
      room.on("participantConnected", participantConnected);

      // Handle participants leaving
      room.on("participantDisconnected", (participant) => {
        setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
        remoteVideoRefs.current.delete(participant.sid);
      });

      // Handle disconnection
      room.on("disconnected", () => {
        if (mountedRef.current) {
          setRoom(null);
          setParticipants([]);
          if (localVideoTrack) {
            localVideoTrack.stop();
          }
          if (localAudioTrack) {
            localAudioTrack.stop();
          }
        }
      });
    } catch (err: any) {
      console.error("Error joining room:", err);
      if (mountedRef.current) {
        setError(err.message || "Failed to join room");
        setIsConnecting(false);
        setHasJoined(false);
      }
    }
  }

  // Auto-join on desktop, but wait for user click on mobile
  useEffect(() => {
    if (!isMobile && !hasJoined) {
      joinRoom();
    }

    return () => {
      mountedRef.current = false;
      if (room) {
        room.disconnect();
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
      }
    };
  }, [roomName, identity, isMobile, hasJoined]);

  // Attach local video track to <video> element
  useEffect(() => {
    const el = localVideoRef.current;
    if (localVideoTrack && el) {
      localVideoTrack.attach(el);
      return () => {
        localVideoTrack.detach();
      };
    }
  }, [localVideoTrack]);

  // Attach remote participant tracks to <video> elements
  useEffect(() => {
    participants.forEach((participant) => {
      participant.videoTracks.forEach((publication) => {
        if (publication.track && publication.isSubscribed) {
          const videoEl = remoteVideoRefs.current.get(participant.sid);
          if (videoEl) {
            publication.track.attach(videoEl);
          }
        }
      });

      participant.audioTracks.forEach((publication) => {
        if (publication.track && publication.isSubscribed) {
          publication.track.attach();
        }
      });
    });
  }, [participants]);

  function participantConnected(participant: RemoteParticipant) {
    setParticipants((prev) => [...prev, participant]);

    // Handle tracks that are already published
    participant.tracks.forEach((publication) => {
      if (publication.track) {
        trackSubscribed(publication.track, participant);
      }
    });

    // Handle tracks published later
    participant.on("trackSubscribed", (track) => {
      trackSubscribed(track, participant);
    });

    participant.on("trackUnsubscribed", (track) => {
      if ("detach" in track && typeof track.detach === "function") {
        track.detach();
      }
    });
  }

  function trackSubscribed(track: any, participant: RemoteParticipant) {
    if (track.kind === "video") {
      const videoEl = remoteVideoRefs.current.get(participant.sid);
      if (videoEl) {
        track.attach(videoEl);
      }
    } else if (track.kind === "audio") {
      track.attach();
    }
  }

  function toggleVideo() {
    if (localVideoTrack) {
      if (isVideoEnabled) {
        localVideoTrack.disable();
      } else {
        localVideoTrack.enable();
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  }

  function toggleAudio() {
    if (localAudioTrack) {
      if (isAudioEnabled) {
        localAudioTrack.disable();
      } else {
        localAudioTrack.enable();
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  }

  function leaveRoom() {
    if (room) {
      room.disconnect();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
    }
    window.location.href = "/";
  }

  // Show join button on mobile (requires user gesture for permissions)
  if (isMobile && !hasJoined && !isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-4">
          <h1 className="text-2xl font-semibold mb-4">Join Video Call</h1>
          <p className="text-gray-300 mb-6">
            Click the button below to join the video call. You'll be asked to allow camera and microphone access.
          </p>
          <button
            onClick={joinRoom}
            className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            Join Call
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-4">
          <h1 className="text-2xl font-semibold mb-4">Error</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setHasJoined(false);
              if (isMobile) {
                // On mobile, show join button again
              } else {
                joinRoom();
              }
            }}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Room: {roomName}</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoEnabled ? "bg-gray-700" : "bg-red-600"} hover:bg-gray-600 transition-colors`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${isAudioEnabled ? "bg-gray-700" : "bg-red-600"} hover:bg-gray-600 transition-colors`}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={leaveRoom}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              title="Leave room"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local video */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
            <video ref={localVideoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-gray-400">Camera off</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
              {identity} (You)
            </div>
          </div>

          {/* Remote participants */}
          {participants.map((participant) => (
            <div
              key={participant.sid}
              className="bg-black rounded-lg overflow-hidden aspect-video relative"
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participant.sid, el);
                  }
                }}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                {participant.identity}
              </div>
            </div>
          ))}

          {participants.length === 0 && (
            <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <p className="text-gray-400">Waiting for others to join...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
