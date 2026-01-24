"use client";

import { useParams, useSearchParams } from "next/navigation";
import { VideoRoom } from "@/components/VideoRoom";

export default function VideoRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomName = params?.roomName as string;
  const identity = searchParams?.get("identity") || null;
  const identityOrUnique = identity ?? (typeof window !== "undefined" ? `Guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` : "Guest");

  if (!roomName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Room name required</h1>
          <p className="text-gray-400">Please provide a room name in the URL.</p>
        </div>
      </div>
    );
  }

  return <VideoRoom roomName={roomName} identity={identityOrUnique} />;
}
