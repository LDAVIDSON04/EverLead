"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  connect,
  createLocalTracks,
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
} from "twilio-video";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface VideoRoomProps {
  roomName: string;
  identity: string;
}

// Mobile-friendly constraints; many phones struggle with 720p
const MOBILE_VIDEO = { width: 640 };
const DESKTOP_VIDEO = { width: 1280, height: 720 };

function friendlyError(err: unknown, isInAppBrowser: boolean): string {
  const msg = err instanceof Error ? err.message : String(err);
  const errName = err instanceof Error ? err.name : "";
  
  // Log the raw error for debugging
  console.log("friendlyError input:", { msg, errName, isInAppBrowser });
  
  // Check for permission errors - show in-app browser message if we're in one
  if (/not allowed|denied|permission|NotAllowedError|getUserMedia|PermissionDeniedError/i.test(msg) || 
      errName === "NotAllowedError" || errName === "PermissionDeniedError") {
    // Only show in-app browser message if we're actually in one AND got permission denied
    if (isInAppBrowser) {
      return "IN_APP_BROWSER"; // Special flag to show in-app browser message
    }
    return "Camera and microphone access was denied. Please allow access in your browser settings and try again.";
  }
  if (/not found|NotFoundError|NotFound/i.test(msg) || errName === "NotFoundError")
    return "No camera or microphone found. Please check your device and try again.";
  if (/failed to get access token|token|401|403|500/i.test(msg))
    return "Unable to connect. Please check your connection and try again.";
  
  // For Safari-specific errors, provide more context
  if (typeof window !== "undefined" && /Safari|webkit/i.test(navigator.userAgent) && /constraint|overconstrained/i.test(msg)) {
    return "Your device may not support the requested video settings. Please try again or use a different device.";
  }
  
  // Return the actual error message so we can see what's wrong
  return msg || "Failed to join the call. Please try again.";
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
  const roomRef = useRef<Room | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  const isMobile =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Detect in-app browsers (Gmail, Facebook, etc.) that often block camera/mic
  const isInAppBrowser = typeof window !== "undefined" && (
    /Gmail|FBAN|FBAV|Twitter|LinkedIn|Instagram|Line|Kakao|WeChat|wv|WebView/i.test(navigator.userAgent) ||
    // Also check if we're in a WebView on iOS (standalone is iOS-specific)
    ((window.navigator as any).standalone === false && /iPhone|iPad|iPod/i.test(navigator.userAgent))
  );

  const cleanup = useCallback(() => {
    const r = roomRef.current;
    const v = localVideoTrackRef.current;
    const a = localAudioTrackRef.current;
    if (r) {
      r.disconnect();
      roomRef.current = null;
    }
    if (v) {
      v.stop();
      localVideoTrackRef.current = null;
    }
    if (a) {
      a.stop();
      localAudioTrackRef.current = null;
    }
  }, []);

  const joinWithTracks = useCallback(
    async (tracks: (LocalVideoTrack | LocalAudioTrack)[]) => {
      const videoTrack = tracks.find((t) => t.kind === "video") as LocalVideoTrack | undefined;
      const audioTrack = tracks.find((t) => t.kind === "audio") as LocalAudioTrack | undefined;

      const res = await fetch("/api/twilio/video-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, identity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get access token");
      }
      const { token } = await res.json();

      const r = await connect(token, {
        name: roomName,
        tracks,
      });

      if (!mountedRef.current) {
        r.disconnect();
        tracks.forEach((t) => t.stop());
        return;
      }

      roomRef.current = r;
      if (videoTrack) localVideoTrackRef.current = videoTrack;
      if (audioTrack) localAudioTrackRef.current = audioTrack;

      setRoom(r);
      setHasJoined(true);
      setIsConnecting(false);
      if (videoTrack) setLocalVideoTrack(videoTrack);
      if (audioTrack) setLocalAudioTrack(audioTrack);

      r.participants.forEach((p) => participantConnected(p));
      r.on("participantConnected", participantConnected);
      r.on("participantDisconnected", (p) => {
        setParticipants((prev) => prev.filter((x) => x.sid !== p.sid));
        remoteVideoRefs.current.delete(p.sid);
      });
      r.on("disconnected", () => {
        if (mountedRef.current) {
          setRoom(null);
          setParticipants([]);
          setLocalVideoTrack(null);
          setLocalAudioTrack(null);
          localVideoTrackRef.current = null;
          localAudioTrackRef.current = null;
          roomRef.current = null;
        }
      });
    },
    [roomName, identity]
  );

  function participantConnected(participant: RemoteParticipant) {
    setParticipants((prev) => [...prev, participant]);
    participant.tracks.forEach((pub) => {
      if (pub.track) trackSubscribed(pub.track, participant);
    });
    participant.on("trackSubscribed", (track) => trackSubscribed(track, participant));
    participant.on("trackUnsubscribed", (track) => {
      if ("detach" in track && typeof (track as any).detach === "function")
        (track as any).detach();
    });
  }

  function trackSubscribed(track: any, participant: RemoteParticipant) {
    if (track.kind === "video") {
      const el = remoteVideoRefs.current.get(participant.sid);
      if (el) track.attach(el);
    } else if (track.kind === "audio") {
      track.attach();
    }
  }

  const joinRoom = useCallback(async () => {
    if (hasJoined) return;
    setIsConnecting(true);
    setError(null);
    mountedRef.current = true;

    try {
      if (isMobile) {
        // Request camera/mic in user gesture, then connect with those tracks
        const raw = await createLocalTracks({
          audio: true,
          video: MOBILE_VIDEO,
        });
        const tracks = raw.filter(
          (t): t is LocalVideoTrack | LocalAudioTrack =>
            t.kind === "video" || t.kind === "audio"
        );
        if (!mountedRef.current) {
          tracks.forEach((t) => t.stop());
          return;
        }
        await joinWithTracks(tracks);
      } else {
        const res = await fetch("/api/twilio/video-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, identity }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get access token");
        }
        const { token } = await res.json();

        const r = await connect(token, {
          name: roomName,
          audio: true,
          video: DESKTOP_VIDEO,
        });

        if (!mountedRef.current) {
          r.disconnect();
          return;
        }

        roomRef.current = r;
        const lv = Array.from(r.localParticipant.videoTracks.values())[0]?.track;
        const la = Array.from(r.localParticipant.audioTracks.values())[0]?.track;
        if (lv) localVideoTrackRef.current = lv;
        if (la) localAudioTrackRef.current = la;

        setRoom(r);
        setHasJoined(true);
        setIsConnecting(false);
        if (lv) setLocalVideoTrack(lv);
        if (la) setLocalAudioTrack(la);

        r.participants.forEach((p) => participantConnected(p));
        r.on("participantConnected", participantConnected);
        r.on("participantDisconnected", (p) => {
          setParticipants((prev) => prev.filter((x) => x.sid !== p.sid));
          remoteVideoRefs.current.delete(p.sid);
        });
        r.on("disconnected", () => {
          if (mountedRef.current) {
            setRoom(null);
            setParticipants([]);
            setLocalVideoTrack(null);
            setLocalAudioTrack(null);
            localVideoTrackRef.current = null;
            localAudioTrackRef.current = null;
            roomRef.current = null;
          }
        });
      }
    } catch (err: unknown) {
      console.error("Error joining room:", err);
      
      // Log detailed error info for debugging
      const errorDetails = err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack,
      } : { message: String(err) };
      
      console.error("Error details:", {
        ...errorDetails,
        isMobile,
        isInAppBrowser,
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
      });
      
      // Send error to server for logging in Vercel
      try {
        await fetch("/api/debug/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: errorDetails,
            context: {
              roomName,
              identity,
              isMobile,
              isInAppBrowser,
              step: "joinRoom",
            },
            userAgent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
            url: typeof window !== "undefined" ? window.location.href : "N/A",
          }),
        }).catch((logErr) => {
          console.error("Failed to log error to server:", logErr);
        });
      } catch (logErr) {
        // Ignore logging errors
      }
      
      if (mountedRef.current) {
        // Show the actual error message for debugging, but also try to make it user-friendly
        const errorMsg = friendlyError(err, isInAppBrowser);
        console.error("Setting error message:", errorMsg);
        setError(errorMsg);
        setIsConnecting(false);
        setHasJoined(false);
      }
    }
  }, [roomName, identity, isMobile, hasJoined, joinWithTracks]);

  // Desktop: auto-join once on mount. Mobile: wait for button click.
  useEffect(() => {
    mountedRef.current = true;
    if (!isMobile && !hasJoined) joinRoom();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const el = localVideoRef.current;
    if (localVideoTrack && el) {
      localVideoTrack.attach(el);
      return () => {
        localVideoTrack.detach();
      };
    }
  }, [localVideoTrack]);

  useEffect(() => {
    participants.forEach((p) => {
      p.videoTracks.forEach((pub) => {
        if (pub.track && pub.isSubscribed) {
          const el = remoteVideoRefs.current.get(p.sid);
          if (el) pub.track!.attach(el);
        }
      });
      p.audioTracks.forEach((pub) => {
        if (pub.track && pub.isSubscribed) pub.track!.attach();
      });
    });
  }, [participants]);

  function toggleVideo() {
    if (localVideoTrack) {
      if (isVideoEnabled) localVideoTrack.disable();
      else localVideoTrack.enable();
      setIsVideoEnabled(!isVideoEnabled);
    }
  }

  function toggleAudio() {
    if (localAudioTrack) {
      if (isAudioEnabled) localAudioTrack.disable();
      else localAudioTrack.enable();
      setIsAudioEnabled(!isAudioEnabled);
    }
  }

  function leaveRoom() {
    cleanup();
    setRoom(null);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setHasJoined(false);
    window.location.href = "/";
  }

  // 1. Error first – never show Join when we have an error
  if (error) {
    // Only show in-app browser instructions if we got a permission error AND we're in an in-app browser
    const showInAppBrowserMessage = error === "IN_APP_BROWSER";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-3">Couldn’t join the call</h1>
          
          {showInAppBrowserMessage ? (
            <>
              <p className="text-red-300 mb-4">
                Video calls don't work in email or social media apps. You need to open this link in your phone's browser.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left text-sm">
                <p className="font-semibold mb-2">How to open in your browser:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span><strong>iPhone:</strong> Tap the link, then tap "Open in Safari" at the bottom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span><strong>Android:</strong> Tap the three dots (⋮) → "Open in browser" or "Open in Chrome"</span>
                  </li>
                </ul>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Or copy the link and paste it into Safari (iPhone) or Chrome (Android).
              </p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    alert("Link copied! Paste it into Safari (iPhone) or Chrome (Android).");
                  } catch (err) {
                    // Fallback for older browsers
                    const textarea = document.createElement("textarea");
                    textarea.value = window.location.href;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                    alert("Link copied! Paste it into Safari (iPhone) or Chrome (Android).");
                  }
                }}
                className="w-full px-4 py-2.5 bg-gray-700 rounded-lg hover:bg-gray-600 font-medium mb-3"
              >
                📋 Copy link
              </button>
            </>
          ) : (
            <>
              <p className="text-red-300 mb-4">{error}</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-gray-500 text-xs mb-6 font-mono">
                  Debug: Check browser console for details
                </p>
              )}
            </>
          )}
          
          <button
            onClick={() => {
              setError(null);
              if (isMobile) {
                /* will show Join button */
              } else {
                joinRoom();
              }
            }}
            className="px-5 py-2.5 bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium"
          >
            {showInAppBrowserMessage ? "Got it" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  // 2. Mobile join screen (only when no error)
  if (isMobile && !hasJoined && !isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-3">Join video call</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Tap below to join. You'll be asked to allow camera and microphone access.
          </p>
          <button
            onClick={joinRoom}
            className="w-full py-3.5 bg-emerald-600 rounded-xl hover:bg-emerald-700 font-semibold text-base"
          >
            Join call
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Connecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-lg font-semibold truncate">Room: {roomName}</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleVideo}
              className={`p-2.5 rounded-full transition-colors ${
                isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2.5 rounded-full transition-colors ${
                isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
              }`}
              title={isAudioEnabled ? "Mute" : "Unmute"}
              aria-label={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={leaveRoom}
              className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
              title="Leave"
              aria-label="Leave call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-gray-400 text-sm">Camera off</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm">
              {identity} (You)
            </div>
          </div>

          {participants.map((p) => (
            <div key={p.sid} className="bg-black rounded-xl overflow-hidden aspect-video relative">
              <video
                ref={(el) => {
                  if (el) remoteVideoRefs.current.set(p.sid, el);
                }}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm">
                {p.identity}
              </div>
            </div>
          ))}

          {participants.length === 0 && (
            <div className="bg-black/40 rounded-xl aspect-video flex items-center justify-center border border-gray-700">
              <p className="text-gray-500 text-sm">Waiting for others to join…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
