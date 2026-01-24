"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DailyVideoRoom } from "@/components/DailyVideoRoom";

export default function VideoRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomName = params?.roomName as string;
  const identity = searchParams?.get("identity") || undefined;
  const role = (searchParams?.get("role") as "host" | "guest") || undefined;

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

  return <DailyVideoRoom roomName={roomName} identity={identity} role={role} />;
}
