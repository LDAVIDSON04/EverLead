"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("Calgary, AB");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      q: searchTerm,
      location: location,
    });
    router.push(`/search?${params.toString()}`);
  };

  const topServices = [
    "Planning for myself",
    "Planning for parents",
    "Planning for a partner",
    "Planning for another relative",
    "Cremation pre-planning",
    "Burial & cemetery pre-planning",
  ];

  return (
    <main className="min-h-screen bg-[#fffaf1]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-0">
            <Image
              src="/logo - white.png"
              alt="Soradin"
              width={70}
              height={70}
              className="object-contain w-10 h-10 md:w-[70px] md:h-[70px]"
            />
            <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 whitespace-nowrap">
              Soradin
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <Link
              href="/agent"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium whitespace-nowrap hidden sm:inline-block"
            >
              For professionals
            </Link>
            <Link
              href="/get-started"
              className="bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-semibold px-5 md:px-6 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#fffaf1] py-8 md:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              {/* Headline - matching Zocdoc style */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1]">
                Book local
                <br />
                <span className="text-gray-900">pre-need advisors</span>
              </h1>

              {/* Search Form - Desktop - matching Zocdoc's compact inline style */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="bg-white rounded-xl shadow-lg p-1 flex gap-1">
                  <div className="flex-1 min-w-0">
                    <label htmlFor="search-desktop" className="sr-only">Search</label>
                    <input
                      id="search-desktop"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Condition, procedure or advisor name"
                      className="w-full px-4 py-3 border-0 focus:outline-none text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="w-48 border-l border-gray-200">
                    <label htmlFor="location-desktop" className="sr-only">Location</label>
                    <select
                      id="location-desktop"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 border-0 focus:outline-none text-gray-900 bg-white text-sm"
                    >
                      <option value="Calgary, AB">Calgary, AB</option>
                      <option value="Edmonton, AB">Edmonton, AB</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    Find care
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Placeholder Illustration */}
            <div className="hidden lg:block">
              <div className="bg-gray-100 rounded-2xl aspect-[4/5] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-sm font-medium">Future Soradin artwork</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Form - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden mt-6">
            <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
              <div>
                <label htmlFor="search-mobile" className="block text-xs font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  id="search-mobile"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Condition, procedure or advisor name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900 text-sm"
                />
              </div>
              <div>
                <label htmlFor="location-mobile" className="block text-xs font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  id="location-mobile"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900 bg-white text-sm"
                >
                  <option value="Calgary, AB">Calgary, AB</option>
                  <option value="Edmonton, AB">Edmonton, AB</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Find care
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Find pre-need specialists section - matching Zocdoc's insurance section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Find pre-need specialists in Calgary & Edmonton
            </h2>
            <p className="text-base text-gray-600">
              Work with local funeral homes, cemeteries, and pre-need advisors in your area.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg p-6 text-center border border-gray-200 min-w-[180px]">
              <h3 className="font-semibold text-gray-900 text-sm">Funeral home pre-planning</h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center border border-gray-200 min-w-[180px]">
              <h3 className="font-semibold text-gray-900 text-sm">Cremation pre-planning</h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center border border-gray-200 min-w-[180px]">
              <h3 className="font-semibold text-gray-900 text-sm">Burial & cemetery pre-planning</h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center border border-gray-200 min-w-[180px]">
              <h3 className="font-semibold text-gray-900 text-sm">Pre-need insurance specialists</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Top-searched pre-need services - matching Zocdoc's specialty grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Top-searched pre-need services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topServices.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="w-12 h-12 rounded-full bg-[#ffd54b] flex items-center justify-center mx-auto mb-3 text-gray-900 font-bold text-lg">
                  {service.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">{service}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common visit reasons - matching Zocdoc's style */}
      <section className="py-12 md:py-16 bg-[#fffaf1]">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Common visit reasons
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-gray-900 font-medium">
              Planning for myself
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-gray-900 font-medium">
              Planning for parents
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-gray-900 font-medium">
              Cremation pre-planning
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-gray-900 font-medium">
              Burial pre-planning
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* How Soradin works - matching Zocdoc's "Let's get you a doc" section */}
      <section className="py-12 md:py-16 bg-[#ffd54b]/10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Let&apos;s get you a pre-need advisor who gets you
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#ffd54b] flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Browse providers who take your insurance
              </h3>
              <p className="text-gray-600 mb-6 text-center text-sm">
                View advisors in Calgary & Edmonton and learn about their expertise.
              </p>
              <div className="text-center">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors text-sm">
                  See specialties
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#ffd54b] flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Read reviews from users
              </h3>
              <p className="text-gray-600 mb-6 text-center text-sm">
                Read bios, experience, and focus areas to find the right match.
              </p>
              <div className="text-center">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors text-sm">
                  See providers
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#ffd54b] flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Book an appointment today, online
              </h3>
              <p className="text-gray-600 mb-6 text-center text-sm">
                Pick a time that works and share your details with one advisor.
              </p>
              <div className="text-center">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors text-sm">
                  See availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-need advisors by city - matching Zocdoc's city grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Find pre-need advisors by city
          </h2>
          <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <Link
              href="/search?location=Calgary%2C%20AB"
              className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 rounded-lg border-b border-gray-200 transition-colors group"
            >
              <span className="text-lg font-medium text-gray-900">Calgary, AB</span>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            <Link
              href="/search?location=Edmonton%2C%20AB"
              className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 rounded-lg border-b border-gray-200 transition-colors group"
            >
              <span className="text-lg font-medium text-gray-900">Edmonton, AB</span>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - matching Zocdoc's footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16">
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
                  <Link href="/faq" className="hover:text-white transition-colors">
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
                Are you a pre-need specialist in Calgary or Edmonton?
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
              <Link
                href="/agent"
                className="inline-block border-2 border-[#ffd54b] text-[#ffd54b] hover:bg-[#ffd54b] hover:text-gray-900 font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
