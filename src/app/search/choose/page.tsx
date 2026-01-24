"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Video, Building2, ArrowRight } from "lucide-react";
import Image from "next/image";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Logo in top left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 lg:top-12 lg:left-12 z-10">
        <Image
          src="/Soradin.png"
          alt="Soradin"
          width={180}
          height={60}
          className="h-12 sm:h-16 w-auto"
          priority
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-28">
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
            What type of care are you looking for?
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to connect with a specialist
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => handleCardClick("in-person")}
            onMouseEnter={() => setHoveredCard("in-person")}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-white rounded-3xl p-10 sm:p-12 shadow-lg hover:shadow-2xl border border-gray-200/60 hover:border-[#0C6F3C]/40 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C6F3C]/0 to-[#0C6F3C]/0 group-hover:from-[#0C6F3C]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#0C6F3C]/10 to-[#0C6F3C]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#0C6F3C]/20 group-hover:to-[#0C6F3C]/10 transition-all duration-300 group-hover:scale-110 shadow-md">
                <Building2 className="w-9 h-9 sm:w-10 sm:h-10 text-[#0C6F3C]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 group-hover:text-[#0C6F3C] transition-colors duration-200">
                    In-Person Meeting
                  </h2>
                  <ArrowRight 
                    className={`w-6 h-6 sm:w-7 sm:h-7 text-gray-400 group-hover:text-[#0C6F3C] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "in-person" ? "translate-x-2" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
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
            className="w-full text-left bg-white rounded-3xl p-10 sm:p-12 shadow-lg hover:shadow-2xl border border-gray-200/60 hover:border-[#0C6F3C]/40 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C6F3C]/0 to-[#0C6F3C]/0 group-hover:from-[#0C6F3C]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#0C6F3C]/10 to-[#0C6F3C]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#0C6F3C]/20 group-hover:to-[#0C6F3C]/10 transition-all duration-300 group-hover:scale-110 shadow-md">
                <Video className="w-9 h-9 sm:w-10 sm:h-10 text-[#0C6F3C]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 group-hover:text-[#0C6F3C] transition-colors duration-200">
                    Video Call
                  </h2>
                  <ArrowRight 
                    className={`w-6 h-6 sm:w-7 sm:h-7 text-gray-400 group-hover:text-[#0C6F3C] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "video" ? "translate-x-2" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                  Connect with a specialist from anywhere in your province
                </p>
              </div>
            </div>
          </button>
        </div>
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
