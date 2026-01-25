"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-[#FFF9F0] py-4 md:py-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 flex justify-center">
        <div className="flex flex-col items-center text-center max-w-2xl">
          <h2 className="text-5xl md:text-6xl text-black mb-8">
            Join the leading scheduling platform
          </h2>
          <Link href="/create-account">
            <button className="bg-white hover:bg-gray-50 text-black border-4 border-black px-8 py-3 rounded-lg shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-0.5">
              Create account
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

