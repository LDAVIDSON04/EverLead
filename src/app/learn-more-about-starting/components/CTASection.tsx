"use client";

import Link from "next/link";
import Image from "next/image";

export function CTASection() {
  return (
    <section className="bg-[#FFF9F0] py-4 md:py-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="z-10 flex flex-col items-center text-center">
            <h2 className="text-5xl md:text-6xl text-black mb-8 max-w-lg">
              Join the leading scheduling platform
            </h2>
            <Link href="/create-account">
              <button className="bg-white hover:bg-gray-50 text-black border-4 border-black px-8 py-3 rounded-lg transition-colors shadow-lg">
                Learn more
              </button>
            </Link>
          </div>

          {/* Right content - scheduling platform hero image (desktop only) */}
          <div className="relative w-full h-full min-h-[500px] hidden md:flex items-center justify-start overflow-visible -mr-12 pr-0">
            <Image 
              src="/scheduling-platform-hero.png" 
              alt="Join the leading scheduling platform" 
              width={800}
              height={500}
              className="w-full h-[500px] object-cover rounded-2xl"
              loading="lazy"
              fetchPriority="low"
              sizes="(max-width: 768px) 0px, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

