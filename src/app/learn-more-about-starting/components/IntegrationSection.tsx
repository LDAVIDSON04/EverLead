"use client";

import Link from "next/link";

export function IntegrationSection() {
  return (
    <section className="bg-[#FFF9F0] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left - Diagram */}
          <div className="relative h-[600px] flex items-center justify-center">
            <img 
              src="/6b0593cc835f18d9641d254dbc73276db55cd173.png" 
              alt="Soradin integration diagram" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-white border-4 border-black rounded-2xl flex items-center justify-center"><div class="text-center"><div class="text-6xl mb-4">🔗</div><p class="text-gray-600">Integration Diagram</p></div></div>';
                }
              }}
            />
          </div>

          {/* Right - Content */}
          <div>
            <p className="text-lg text-gray-700 mb-8">
              Soradin connects directly with your existing Google and Microsoft calendars — syncing availability in real time so appointments flow seamlessly without changing how you work.
            </p>
            <Link href="/create-account">
              <button className="bg-[#0D5C3D] hover:bg-[#0A4A30] text-white px-8 py-3 rounded-lg transition-colors">
                Learn more
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

