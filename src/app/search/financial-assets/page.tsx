"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";

const ASSET_BRACKETS = [
  { value: 0, label: "$0" },
  { value: 100000, label: "$100K" },
  { value: 250000, label: "$250K" },
  { value: 500000, label: "$500K" },
  { value: 1000000, label: "$1M+" },
];

const MAX_ASSET_DISPLAY = 1000000;

/** Fill % so the dark bar ends exactly at the thumb (5 steps: 0, 25, 50, 75, 100). */
function fillPercentFromStepIndex(stepIndex: number): number {
  if (stepIndex <= 0) return 0;
  return (stepIndex / 4) * 100;
}

/** Nearest bracket index (0–4) for $0, $100K, $250K, $500K, $1M+. */
function nearestBracketIndex(value: number): number {
  let best = 0;
  let bestDiff = Math.abs(ASSET_BRACKETS[0].value - value);
  for (let i = 1; i < ASSET_BRACKETS.length; i++) {
    const d = Math.abs(ASSET_BRACKETS[i].value - value);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}

function FinancialAssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const q = searchParams.get("q") || "";
  const mode = (searchParams.get("mode") || "in-person") as "in-person" | "video";

  const [assetValue, setAssetValue] = useState(0);

  /** Slider snaps to 5 positions: 0, 100K, 250K, 500K, 1M+. */
  const sliderIndex = nearestBracketIndex(assetValue);

  useEffect(() => {
    if (!location.trim() || !mode) {
      router.replace("/search/choose?" + new URLSearchParams({ location: location || "Canada" }).toString());
      return;
    }
  }, [location, mode, router]);

  // Tax accountant is a separate profession — skip portfolio step (defensive for old bookmarks)
  useEffect(() => {
    const qLower = q.trim().toLowerCase();
    if (!qLower) return;
    if (!/\btax\s+accountants?\b/i.test(q)) return;
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    params.set("q", q);
    params.set("mode", mode);
    router.replace(`/search?${params.toString()}`);
  }, [q, location, mode, router]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    setAssetValue(ASSET_BRACKETS[index].value);
  };

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (q) params.set("q", q);
    params.set("mode", mode);
    params.set("assets", String(assetValue));
    router.push(`/search?${params.toString()}`);
  };

  if (!location.trim()) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A1A1A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="sm:hidden pt-3 pl-6 pb-1 flex items-center gap-3">
        <Image src="/Soradin.png" alt="Soradin" width={300} height={100} className="h-16 w-auto" priority />
        <span className="text-gray-800 font-semibold text-sm">Soradin - Estate Planning, Simplified</span>
      </div>
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 lg:top-10 lg:left-10 z-10 hidden sm:flex sm:items-center sm:gap-3">
        <Image src="/Soradin.png" alt="Soradin" width={300} height={100} className="h-20 sm:h-28 lg:h-32 w-auto" priority />
        <span className="text-gray-800 font-semibold text-sm sm:text-base">Soradin - Estate Planning, Simplified</span>
      </div>

      <div className="min-h-screen flex flex-col justify-center max-w-2xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 text-center max-w-xl">
          What is the approximate value of your portfolio?
        </h1>
        <p className="text-gray-600 text-center mb-8 sm:mb-10">
          This helps us match you with advisors who work with clients in your range.
        </p>

        <div className="w-full">
        {/* Slider labels */}
        <div className="flex justify-between text-sm text-gray-600 mb-2 px-1">
          {ASSET_BRACKETS.map((b) => (
            <span key={b.value}>{b.label}</span>
          ))}
        </div>
        {/* One track barrel: grey full width, black fill same height on top — no "line inside grey" */}
        <div className="relative w-full h-8 mb-2 flex items-center">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden pointer-events-none">
            {/* Grey track - full width */}
            <div className="absolute inset-0 bg-gray-200" />
            {/* Black fill - same layer height, so it’s a solid bar not a thin line */}
            <div
              className="absolute inset-y-0 left-0 bg-[#1A1A1A] rounded-l-full"
              style={{ width: `${fillPercentFromStepIndex(sliderIndex)}%` }}
            />
          </div>
          {/* Range input on top for thumb and drag */}
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={sliderIndex}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1A1A1A] [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:mt-0 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1A1A1A] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:mt-0"
          />
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            className="px-8 py-4 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors"
          >
            Continue to results
          </button>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialAssetsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A1A1A] border-t-transparent" />
        </div>
      }
    >
      <FinancialAssetsContent />
    </Suspense>
  );
}
