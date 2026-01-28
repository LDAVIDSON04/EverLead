"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
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
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A1A1A] border-t-transparent" />
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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile only: logo in flow, top left above title */}
      <div className="sm:hidden pt-3 pl-6 pb-1">
        <Image
          src="/Soradin.png"
          alt="Soradin"
          width={300}
          height={100}
          className="h-16 w-auto"
          priority
        />
      </div>
      {/* Desktop: logo absolute */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 lg:top-10 lg:left-10 z-10 hidden sm:block">
        <Image
          src="/Soradin.png"
          alt="Soradin"
          width={300}
          height={100}
          className="h-20 sm:h-28 lg:h-32 w-auto"
          priority
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-1 sm:pt-12 pb-12 sm:pb-16 sm:py-16">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-5 tracking-tight">
            How would you like to meet?
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto">
            Choose the option that fits your schedule. Both are free and come with no obligation.
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <button
            type="button"
            onClick={() => handleCardClick("video")}
            onMouseEnter={() => setHoveredCard("video")}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-white rounded-2xl p-8 sm:p-10 lg:p-12 shadow-md hover:shadow-xl border border-gray-200/60 hover:border-[#1A1A1A]/40 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/0 to-[#1A1A1A]/0 group-hover:from-[#1A1A1A]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-6 sm:gap-8 lg:gap-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-[#1A1A1A]/10 to-[#1A1A1A]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#1A1A1A]/20 group-hover:to-[#1A1A1A]/10 transition-all duration-300 group-hover:scale-110 shadow-sm overflow-hidden">
                <Image
                  src="/video-call-icon.png"
                  alt="Video call"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 group-hover:text-[#1A1A1A] transition-colors duration-200">
                    Video Call
                  </h2>
                  <ArrowRight 
                    className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400 group-hover:text-[#1A1A1A] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "video" ? "translate-x-1" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg lg:text-xl">
                  Secure, private, and from the comfort of your home. No downloads required.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCardClick("in-person")}
            onMouseEnter={() => setHoveredCard("in-person")}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-white rounded-2xl p-8 sm:p-10 lg:p-12 shadow-md hover:shadow-xl border border-gray-200/60 hover:border-[#1A1A1A]/40 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/0 to-[#1A1A1A]/0 group-hover:from-[#1A1A1A]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
            
            <div className="relative flex items-start gap-6 sm:gap-8 lg:gap-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-[#1A1A1A]/10 to-[#1A1A1A]/5 flex items-center justify-center flex-shrink-0 group-hover:from-[#1A1A1A]/20 group-hover:to-[#1A1A1A]/10 transition-all duration-300 group-hover:scale-110 shadow-sm overflow-hidden">
                <Image
                  src="/in-person-meeting-icon.png"
                  alt="In person meeting"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 group-hover:text-[#1A1A1A] transition-colors duration-200">
                    In Person Meeting
                  </h2>
                  <ArrowRight 
                    className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400 group-hover:text-[#1A1A1A] transition-all duration-300 flex-shrink-0 mt-1 ${
                      hoveredCard === "in-person" ? "translate-x-1" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg lg:text-xl">
                  Meet with a specialist at their office in your area
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A1A1A] border-t-transparent" />
      </div>
    }>
      <SearchChooseContent />
    </Suspense>
  );
}
