"use client";

import { useEffect, useState } from "react";

interface AuctionCountdownProps {
  auctionEndsAt: string | null;
  auctionStatus: 'open' | 'closed' | 'pending' | null;
  onEnd?: () => void;
}

export function AuctionCountdown({ auctionEndsAt, auctionStatus, onEnd }: AuctionCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState(auctionStatus);

  useEffect(() => {
    // Reset local status when prop changes
    setLocalStatus(auctionStatus);
  }, [auctionStatus]);

  useEffect(() => {
    // Don't show countdown if no end time or not open
    if (!auctionEndsAt || localStatus !== 'open') {
      setRemaining(null);
      return;
    }

    const end = new Date(auctionEndsAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      setRemaining(diff);

      if (diff <= 0) {
        setLocalStatus('closed');
        if (onEnd) {
          onEnd();
        }
      }
    };

    // Initial tick
    tick();

    // Update every second
    const intervalId = setInterval(tick, 1000);

    return () => clearInterval(intervalId);
  }, [auctionEndsAt, localStatus, onEnd]);

  // Format remaining time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  };

  // Handle different states
  if (localStatus === 'closed' || (remaining !== null && remaining <= 0)) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 border border-slate-300 text-slate-400 bg-slate-50 text-[11px]">
        Auction ended
      </span>
    );
  }

  if (localStatus === 'open' && remaining !== null) {
    const isUrgent = remaining < 60000; // Less than 1 minute
    return (
      <div className="text-sm text-gray-600 mt-2">
        Auction ends in: <span className="font-medium">{formatTime(remaining)}</span>
      </div>
    );
  }

  return null;
}

