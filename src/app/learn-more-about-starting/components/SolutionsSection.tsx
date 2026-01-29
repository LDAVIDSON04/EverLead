"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SolutionsSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-wider text-gray-600 mb-4">Our solutions</p>
          <h2 className="text-4xl md:text-5xl text-black max-w-4xl">
            How Soradin Helps Families Plan Ahead
          </h2>
        </div>

        {/* Card 1: Marketplace – text left, image right (Estate Planning style) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[min(70vh,520px)] md:min-h-[480px] gap-0 overflow-hidden rounded-2xl shadow-lg md:shadow-xl border-2 border-black mb-8 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none order-2 md:order-1">
            <p className="text-sm font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-2">Marketplace</p>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] tracking-tight mb-4 md:mb-6">
              Reach families on Soradin
            </h3>
            <p className="text-base md:text-lg text-[#1A1A1A]/70 leading-relaxed mb-6 md:mb-8 max-w-lg">
              Families search by location and service to find and book with you. Get in front of thousands of families looking for pre-need planning across the province.
            </p>
            <Link
              href="/create-account"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 transition-all shrink-0 text-sm font-medium w-fit"
              aria-label="Learn more about Soradin Marketplace"
            >
              <span>Learn more</span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Link>
          </div>
          <div className="relative w-full min-h-[50vh] md:min-h-full rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none overflow-hidden order-1 md:order-2">
            <Image
              src="/soradin-laptop-marketplace.png"
              alt="Soradin marketplace on laptop and phone"
              fill
              className="object-cover object-center"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Card 2: Website scheduling – image left, text right */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[min(70vh,520px)] md:min-h-[480px] gap-0 overflow-hidden rounded-2xl shadow-lg md:shadow-xl border-2 border-black transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1">
          <div className="relative w-full min-h-[50vh] md:min-h-full rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden order-1 md:order-1">
            <Image
              src="/soradin-website-scheduling.png"
              alt="Website scheduling calendar on laptop"
              fill
              className="object-cover object-center"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none order-2 md:order-2">
            <p className="text-sm font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-2">Scheduling</p>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] tracking-tight mb-4 md:mb-6">
              Website scheduling
            </h3>
            <p className="text-base md:text-lg text-[#1A1A1A]/70 leading-relaxed mb-6 md:mb-8 max-w-lg">
              Ensure families on your website can book anytime with 24/7 online scheduling. One calendar for in-person and video—sync with Google or Microsoft.
            </p>
            <Link
              href="/create-account"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 transition-all shrink-0 text-sm font-medium w-fit"
              aria-label="Learn more about Website scheduling"
            >
              <span>Learn more</span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
