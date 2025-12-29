"use client";

import { Button } from "@/components/ui/button";

export function IntegrationSection() {
  return (
    <section className="bg-[#FFF9F0] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left - Diagram placeholder */}
          <div className="relative h-[600px] flex items-center justify-center">
            <div className="w-full h-full bg-white border-4 border-black rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🔗</div>
                <p className="text-gray-600">Integration Diagram</p>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h2 className="text-4xl md:text-5xl text-black mb-6">
              Soradin works with your scheduling software
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              We integrate with 175+ EHRs, practice management systems, and custom solutions
            </p>
            <Button className="bg-[#0D5C3D] hover:bg-[#0A4A30] text-white px-8 py-3 rounded-lg transition-colors">
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

