"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { MapPin, Video, Building2, ArrowRight } from "lucide-react";

function SearchChooseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const q = searchParams.get("q") || "";
  const [hoveredCard, setHoveredCard] = useState<"in-person" | "video" | null>(null);

  useEffect(() => {
    if (!location.trim()) {
      router.replace("/");
    }
  }, [location, router]);

  if (!location.trim()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="flex justify-end mb-8">
          <Link
            href={skipUrl}
            className="text-sm font-medium text-gray-600 hover:text-[#0C6F3C] transition-colors duration-200"
          >
            Skip to search results
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            What type of care are you looking for?
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Choose how you'd like to connect with a specialist
          </p>
        </div>

        <div className="space-y-5 mb-12">
          <button
            type="button"
            onClick={() => handleCardClick("in-person")}
            onMouseEnter={() => setHoveredCard("in-person")}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-200/60 hover:border-[#0C6F3C]/30 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C6F3C]/0 to-[#0C6F3C]/0 group-hover:from-[#0C6F3C]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C6F3C]/10 to-[#0C6F3C]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#0C6F3C]/20 group-hover:to-[#0C6F3C]/10 transition-all duration-300 group-hover:scale-110 shadow-sm">
                <Building2 className="w-7 h-7 text-[#0C6F3C]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-[#0C6F3C] transition-colors duration-200">
                    In-Person Meeting
                  </h2>
                  <ArrowRight 
                    className={`w-5 h-5 text-gray-400 group-hover:text-[#0C6F3C] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "in-person" ? "translate-x-1" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base">
                  Meet with a specialist at their office in your area
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCardClick("video")}
            onMouseEnter={() => setHoveredCard("video")}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-200/60 hover:border-[#0C6F3C]/30 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C6F3C]/0 to-[#0C6F3C]/0 group-hover:from-[#0C6F3C]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C6F3C]/10 to-[#0C6F3C]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#0C6F3C]/20 group-hover:to-[#0C6F3C]/10 transition-all duration-300 group-hover:scale-110 shadow-sm">
                <Video className="w-7 h-7 text-[#0C6F3C]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-[#0C6F3C] transition-colors duration-200">
                    Video Call
                  </h2>
                  <ArrowRight 
                    className={`w-5 h-5 text-gray-400 group-hover:text-[#0C6F3C] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "video" ? "translate-x-1" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base">
                  Connect with a specialist from anywhere in your province
                </p>
              </div>
            </div>
          </button>
        </div>

        {location && (
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-full border border-gray-200/60 shadow-sm">
              <MapPin className="w-4 h-4 text-[#0C6F3C]" />
              <span>Searching near <span className="text-gray-700 font-semibold">{location}</span></span>
            </p>
          </div>
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
