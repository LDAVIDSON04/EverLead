"use client";

import { useAuctionCountdown } from "./AuctionCountdown";

interface AuctionBidButtonsProps {
  leadId: string;
  minIncrement: number;
  currentBid: number;
  biddingId: string | null;
  showBidForm: boolean;
  auctionEndTime: string | null;
  auctionStatus: 'open' | 'scheduled' | 'ended' | null;
  onPlaceBid: (leadId: string, increment: number) => void;
}

export function AuctionBidButtons({
  leadId,
  minIncrement,
  currentBid,
  biddingId,
  showBidForm,
  auctionEndTime,
  auctionStatus,
  onPlaceBid,
}: AuctionBidButtonsProps) {
  // Use countdown hook to check if auction has ended
  const { isAuctionEnded } = useAuctionCountdown(
    auctionStatus === 'open' && auctionEndTime ? auctionEndTime : null
  );

  const shouldDisable = isAuctionEnded || !showBidForm;

  if (!showBidForm && !isAuctionEnded) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] text-slate-500">
        Bid increments:
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPlaceBid(leadId, minIncrement)}
          disabled={shouldDisable || biddingId === leadId}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            shouldDisable
              ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
              : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          }`}
        >
          {biddingId === leadId ? "Placing…" : `+ $${minIncrement}`}
        </button>
        <button
          onClick={() => onPlaceBid(leadId, minIncrement * 2)}
          disabled={shouldDisable || biddingId === leadId}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            shouldDisable
              ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
              : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          }`}
        >
          {biddingId === leadId ? "Placing…" : `+ $${minIncrement * 2}`}
        </button>
        <button
          onClick={() => onPlaceBid(leadId, minIncrement * 3)}
          disabled={shouldDisable || biddingId === leadId}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            shouldDisable
              ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
              : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          }`}
        >
          {biddingId === leadId ? "Placing…" : `+ $${minIncrement * 3}`}
        </button>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        Next bid: ${(currentBid + minIncrement).toFixed(2)}
      </p>
    </div>
  );
}

