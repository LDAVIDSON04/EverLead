"use client";

import Link from "next/link";

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
          <div className="relative w-full h-full min-h-[700px] hidden md:flex items-center justify-center overflow-visible -mr-6">
            <img 
              src="/scheduling-platform-hero.png" 
              alt="Join the leading scheduling platform" 
              className="w-full h-full max-w-none object-contain"
              style={{ 
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-white border-4 border-black rounded-2xl flex items-center justify-center p-8"><div class="text-center"><div class="text-6xl mb-4">👥</div><p class="text-gray-600">Scheduling Platform</p></div></div>';
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

