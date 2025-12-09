"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("Calgary, AB");
  const [insurance, setInsurance] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      q: searchTerm,
      location: location,
    });
    router.push(`/search?${params.toString()}`);
  };

  const specialties = [
    { name: "Funeral Planning", icon: "⚱️" },
    { name: "Cremation", icon: "🔥" },
    { name: "Burial Planning", icon: "🪦" },
    { name: "Pre-need Insurance", icon: "📋" },
    { name: "Estate Planning", icon: "📄" },
    { name: "Memorial Services", icon: "🕯️" },
  ];

  const cities = [
    "Calgary, AB",
    "Edmonton, AB",
  ];

  return (
    <main className="min-h-screen bg-[#fffaf1]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo - white.png"
              alt="Soradin"
              width={40}
              height={40}
              className="object-contain w-10 h-10"
            />
            <span className="text-xl font-bold text-[#111827]">Soradin</span>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/agent"
              className="text-sm text-[#111827] hover:text-gray-600 transition-colors font-medium hidden md:inline-block"
            >
              For Professionals
            </Link>
            <Link
              href="/help"
              className="text-sm text-[#111827] hover:text-gray-600 transition-colors font-medium hidden md:inline-block"
            >
              Help
            </Link>
            <Link
              href="/agent"
              className="text-sm text-[#111827] hover:text-gray-600 transition-colors font-medium hidden md:inline-block"
            >
              List your practice
            </Link>
            <Link
              href="/login"
              className="text-sm text-[#111827] hover:text-gray-600 transition-colors font-medium"
            >
              Log in
            </Link>
            <Link
              href="/get-started"
              className="bg-[#ffd43d] hover:bg-[#ffcc00] text-[#111827] font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#fffaf1] py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Headline - matching Zocdoc exactly */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#111827] leading-tight">
                Book local
                <br />
                <span className="text-[#111827]">who take your insurance</span>
              </h1>

              {/* Search Form - matching Zocdoc's exact style */}
              <form onSubmit={handleSearch} className="w-full">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <input
                        id="search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Condition, procedure or advisor name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd43d] focus:border-transparent text-[#111827] placeholder-gray-400 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <select
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd43d] focus:border-transparent text-[#111827] bg-white text-sm"
                      >
                        <option value="Calgary, AB">Calgary, AB</option>
                        <option value="Edmonton, AB">Edmonton, AB</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="insurance" className="block text-xs font-medium text-gray-700 mb-2">
                        Add insurance
                      </label>
                      <input
                        id="insurance"
                        type="text"
                        value={insurance}
                        onChange={(e) => setInsurance(e.target.value)}
                        placeholder="Insurance carrier and plan"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd43d] focus:border-transparent text-[#111827] placeholder-gray-400 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-[#ffd43d] hover:bg-[#ffcc00] text-[#111827] font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find care
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Illustration Placeholder - matching Zocdoc style */}
            <div className="hidden lg:block">
              <div className="bg-[#fffaf1] rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-64 h-64 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🏥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance Partners Section - matching Zocdoc's "Find an in-network doctor" */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-3">
              Find pre-need advisors from trusted providers
            </h2>
            <p className="text-base text-gray-600">
              Connect with local funeral homes, cemeteries, and pre-need specialists in your area
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm min-w-[160px] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">Funeral Homes</h3>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm min-w-[160px] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🪦</span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">Cemeteries</h3>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm min-w-[160px] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">Pre-need Insurance</h3>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm min-w-[160px] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚱️</span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">Cremation Services</h3>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm min-w-[160px] hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">Estate Planning</h3>
            </div>
          </div>
          <div className="text-center">
            <button className="text-[#111827] font-medium hover:text-gray-600 transition-colors">
              See all providers →
            </button>
          </div>
        </div>
      </section>

      {/* Top-searched specialties - matching Zocdoc exactly */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-10 text-center">
            Top-searched specialties
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {specialties.map((specialty, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
              >
                <div className="w-20 h-20 rounded-xl bg-[#fffaf1] flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">{specialty.icon}</span>
                </div>
                <h3 className="font-semibold text-[#111827] text-sm leading-tight">{specialty.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Let's get you a doc who gets you" section - matching Zocdoc exactly */}
      <section className="py-12 md:py-16 bg-[#fffaf1]">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-12 text-center">
            Let&apos;s get you a pre-need advisor who gets you
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-[#fffaf1] flex items-center justify-center mb-6">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">
                Browse providers who take your insurance
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                View pre-need advisors in Calgary & Edmonton and learn about their expertise.
              </p>
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-[#111827] font-medium hover:bg-gray-50 transition-colors text-sm">
                See specialties
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-[#fffaf1] flex items-center justify-center mb-6">
                <span className="text-4xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">
                Read reviews from users
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Learn from others who have worked with these advisors.
              </p>
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-[#111827] font-medium hover:bg-gray-50 transition-colors text-sm">
                See providers
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-[#fffaf1] flex items-center justify-center mb-6">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">
                Book an appointment today, online
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Pick a time that works and share your details with one advisor.
              </p>
              <button className="px-6 py-2 border border-gray-300 rounded-lg text-[#111827] font-medium hover:bg-gray-50 transition-colors text-sm">
                See availability
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section - matching Zocdoc's city grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-10 text-center">
            Find pre-need advisors by city
          </h2>
          <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {cities.map((city, index) => (
              <Link
                key={index}
                href={`/search?location=${encodeURIComponent(city)}`}
                className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 rounded-lg border-b border-gray-200 transition-colors group"
              >
                <span className="text-base font-medium text-[#111827]">{city}</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - matching Zocdoc's footer */}
      <footer className="bg-[#2d2d2d] text-gray-300 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Soradin */}
            <div>
              <h3 className="font-semibold text-white mb-4">Soradin</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help
                  </Link>
                </li>
              </ul>
            </div>

            {/* Discover */}
            <div>
              <h3 className="font-semibold text-white mb-4">Discover</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/resources" className="hover:text-white transition-colors">
                    Practice Resources for advisors
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-white transition-colors">
                    Community Standards
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Data and privacy
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:text-white transition-colors">
                    Verified reviews
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Callout */}
            <div>
              <h3 className="font-semibold text-white mb-4">
                Are you a pre-need specialist?
              </h3>
              <ul className="space-y-2 text-sm mb-4">
                <li>
                  <Link href="/agent" className="hover:text-white transition-colors">
                    List your practice on Soradin
                  </Link>
                </li>
                <li>
                  <Link href="/agent/pricing" className="hover:text-white transition-colors">
                    Learn about Soradin pricing
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-xs text-gray-500">
            <p className="mb-2">
              The content provided here and elsewhere on the Soradin site is provided for general informational purposes only. 
              It is not intended as, and Soradin does not provide, legal or financial advice. 
              Always contact a qualified professional directly with any questions you may have regarding your planning needs.
            </p>
            <p>© {new Date().getFullYear()} Soradin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
