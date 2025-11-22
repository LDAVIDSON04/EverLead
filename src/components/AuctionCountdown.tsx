"use client";

import { useEffect, useState } from "react";

interface AuctionCountdownProps {
  auctionEndsAt: string | null;
  auctionStatus: 'open' | 'closed' | 'pending' | null;
  onEnd?: () => void;
}

export interface AuctionCountdownResult {
  timeLeftLabel: string | null;
  isAuctionEnded: boolean;
}

export function useAuctionCountdown(auctionEndAt?: string | Date | null): AuctionCountdownResult {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!auctionEndAt) {
      setRemainingMs(null);
      return;
    }

    const end = new Date(auctionEndAt).getTime();

    const update = () => {
      const now = Date.now();
      const diff = end - now;
      setRemainingMs(diff > 0 ? diff : 0);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [auctionEndAt]);

  if (remainingMs === null) {
    return { timeLeftLabel: null, isAuctionEnded: false };
  }

  if (remainingMs <= 0) {
    return { timeLeftLabel: "0s", isAuctionEnded: true };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const label =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  return { timeLeftLabel: label, isAuctionEnded: false };
}

export function AuctionCountdown({ auctionEndsAt, auctionStatus, onEnd }: AuctionCountdownProps) {
  const { timeLeftLabel, isAuctionEnded } = useAuctionCountdown(auctionEndsAt);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    if (isAuctionEnded && !hasEnded) {
      setHasEnded(true);
      if (onEnd) {
        onEnd();
      }
    }
  }, [isAuctionEnded, hasEnded, onEnd]);

  // Don't show anything if no end time or not open
  if (!auctionEndsAt || auctionStatus !== 'open') {
    return null;
  }

  // Show ended message
  if (isAuctionEnded || hasEnded) {
    return (
      <p className="mt-1 text-sm font-medium text-red-600">
        Auction ended — bidding closed
      </p>
    );
  }

  // Show countdown
  if (timeLeftLabel) {
    return (
      <p className="mt-1 text-sm text-gray-600">
        Auction ends in <span className="font-medium text-gray-800">{timeLeftLabel}</span>
      </p>
    );
  }

  return null;
}

