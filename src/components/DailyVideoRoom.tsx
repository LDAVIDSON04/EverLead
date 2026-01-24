"use client";

import { useState, useEffect } from "react";

interface DailyVideoRoomProps {
  roomName: string;
  /** Display name for the participant (optional; Daily may support via URL params) */
  identity?: string;
}

export function DailyVideoRoom({ roomName, identity }: DailyVideoRoomProps) {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchRoom() {
      try {
        const res = await fetch(`/api/daily/room?name=${encodeURIComponent(roomName)}`);
        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setError(data.error || "Failed to get video room");
          setLoading(false);
          return;
        }

        let url = data.url as string;
        if (identity && url) {
          try {
            const u = new URL(url);
            u.searchParams.set("userName", identity);
            url = u.toString();
          } catch {
            // keep original url
          }
        }

        setRoomUrl(url || null);
        if (!url) setError("No room URL returned");
      } catch (e) {
        if (mounted) {
          setError((e as Error).message || "Failed to load video room");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRoom();
    return () => {
      mounted = false;
    };
  }, [roomName, identity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Connecting to video call…</p>
        </div>
      </div>
    );
  }

  if (error || !roomUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-3">Couldn’t join the call</h1>
          <p className="text-red-300 mb-6">{error || "Missing room URL"}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900">
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; display-capture"
        className="w-full h-full border-0"
        title="Video call"
      />
    </div>
  );
}
