"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { MapPin, Video, Building2 } from "lucide-react";

function SearchChooseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const q = searchParams.get("q") || "";

  useEffect(() => {
    if (!location.trim()) {
      router.replace("/");
    }
  }, [location, router]);

  if (!location.trim()) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0C6F3C] border-t-transparent" />
      </div>
    );
  }

  const buildSearchUrl = (mode: "in-person" | "video") => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (q) params.set("q", q);
    params.set("mode", mode);
    return `/search?${params.toString()}`;
  };

  const handleCardClick = (mode: "in-person" | "video") => {
    router.push(buildSearchUrl(mode));
  };

  const skipUrl = buildSearchUrl("in-person");

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        <div className="flex justify-end mb-6">
          <Link
            href={skipUrl}
            className="text-sm text-[#1A1A1A]/60 hover:text-[#0C6F3C] transition-colors"
          >
            Skip to search results
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] text-center mb-12">
          What type of care are you looking for?
        </h1>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleCardClick("in-person")}
            className="w-full text-left bg-white border-2 border-[#1A1A1A]/10 hover:border-[#0C6F3C] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0C6F3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0C6F3C]/20 transition-colors">
                <Building2 className="w-6 h-6 text-[#0C6F3C]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-1">
                  Would you like an in-person meeting
                </h2>
                <p className="text-[#1A1A1A]/70">
                  Meet with a specialist at their office in your area
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCardClick("video")}
            className="w-full text-left bg-white border-2 border-[#1A1A1A]/10 hover:border-[#0C6F3C] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0C6F3C]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0C6F3C]/20 transition-colors">
                <Video className="w-6 h-6 text-[#0C6F3C]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-1">
                  Would you like a video call
                </h2>
                <p className="text-[#1A1A1A]/70">
                  Connect with a specialist from anywhere in your province
                </p>
              </div>
            </div>
          </button>
        </div>

        {location && (
          <p className="text-center text-sm text-[#1A1A1A]/60 mt-8 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" />
            Searching near {location}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchChoosePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0C6F3C] border-t-transparent" />
      </div>
    }>
      <SearchChooseContent />
    </Suspense>
  );
}
