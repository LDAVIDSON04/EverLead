"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DailyVideoRoom } from "@/components/DailyVideoRoom";

function getParamCaseInsensitive(searchParams: URLSearchParams, keyLower: string): string | null {
  const want = keyLower.toLowerCase();
  let value: string | null = searchParams.get(keyLower);
  if (value != null) return value;
  searchParams.forEach((v, k) => {
    if (k.toLowerCase() === want) value = v;
  });
  return value;
}

export default function VideoRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomName = params?.roomName as string;
  const identity = getParamCaseInsensitive(searchParams, "identity") || undefined;
  const role = (getParamCaseInsensitive(searchParams, "role") as "host" | "guest") || undefined;

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
