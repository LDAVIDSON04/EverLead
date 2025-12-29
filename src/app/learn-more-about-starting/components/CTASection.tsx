"use client";

export function CTASection() {
  return (
    <section className="bg-[#FFF9F0] py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="z-10 flex flex-col items-center text-center">
            <h2 className="text-5xl md:text-6xl text-black mb-8 max-w-lg">
              Join the leading scheduling platform
            </h2>
            <button className="bg-white hover:bg-gray-50 text-black border-4 border-black px-8 py-3 rounded-lg transition-colors shadow-lg">
              Learn more
            </button>
          </div>

          {/* Right content - appointment cards image */}
          <div className="relative min-h-[700px] -mr-6 -mb-12 hidden md:block flex items-center justify-center">
            <img 
              src="/1287f77558fc6a47c506a92275bdcb435d5dc5d5.png" 
              alt="Professional appointment cards" 
              className="w-full h-full object-contain scale-150 mt-24"
              style={{ 
                filter: 'brightness(1.05) contrast(1.05)',
                mixBlendMode: 'darken'
              }}
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-white border-4 border-black rounded-2xl flex items-center justify-center p-8"><div class="text-center"><div class="text-6xl mb-4">📅</div><p class="text-gray-600">Professional Scheduling</p></div></div>';
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

