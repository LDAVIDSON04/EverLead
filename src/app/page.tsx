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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3 md:py-5">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-0">
            <Image
              src="/logo - white.png"
              alt="Soradin"
              width={70}
              height={70}
              className="object-contain w-12 h-12 md:w-[70px] md:h-[70px]"
            />
            <span className="text-lg md:text-xl font-semibold tracking-wide text-gray-900 whitespace-nowrap">
              Soradin
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <Link
              href="/agent"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium tracking-wide whitespace-nowrap hidden sm:inline-block"
            >
              For professionals
            </Link>
            <Link
              href="/get-started"
              className="bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-semibold px-4 md:px-6 py-2 rounded-lg transition-colors whitespace-nowrap text-sm md:text-base"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#fffaf1] py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1]">
                Book local pre-need advisors
                <br />
                <span className="text-gray-700">who take your insurance</span>
              </h1>

              {/* Search Form - Desktop */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="search-desktop" className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <input
                        id="search-desktop"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Condition, procedure or advisor name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="location-desktop" className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <select
                        id="location-desktop"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="Calgary, AB">Calgary, AB</option>
                        <option value="Edmonton, AB">Edmonton, AB</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-base"
                      >
                        Find care
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Placeholder Illustration */}
            <div className="hidden lg:block lg:pt-8">
              <div className="bg-gray-100 rounded-3xl aspect-[4/5] flex items-center justify-center shadow-lg">
                <div className="text-center text-gray-400">
                  <p className="text-sm font-medium">Future Soradin artwork</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Form - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              <div>
                <label htmlFor="search-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  id="search-mobile"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Condition, procedure or advisor name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="location-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  id="location-mobile"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd54b] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="Calgary, AB">Calgary, AB</option>
                  <option value="Edmonton, AB">Edmonton, AB</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Find care
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Find pre-need specialists section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find pre-need specialists in Calgary & Edmonton
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Work with local funeral homes, cemeteries, and pre-need advisors in your area.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
              <h3 className="font-semibold text-gray-900">Funeral home pre-planning</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
              <h3 className="font-semibold text-gray-900">Cremation pre-planning</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
              <h3 className="font-semibold text-gray-900">Burial & cemetery pre-planning</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
              <h3 className="font-semibold text-gray-900">Pre-need insurance specialists</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Top-searched pre-need services */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Top-searched pre-need services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {topServices.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="w-16 h-16 rounded-full bg-[#ffd54b] flex items-center justify-center mx-auto mb-4 text-gray-900 font-bold text-xl">
                  {service.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">{service}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Soradin works */}
      <section className="py-16 md:py-24 bg-[#ffd54b]/10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            How Soradin works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Browse local pre-need specialists
              </h3>
              <p className="text-gray-600 mb-6">
                View advisors in Calgary & Edmonton and learn about their expertise.
              </p>
              <button className="text-[#ffd54b] font-semibold hover:underline">
                See specialists →
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Learn about their expertise
              </h3>
              <p className="text-gray-600 mb-6">
                Read bios, experience, and focus areas to find the right match.
              </p>
              <button className="text-[#ffd54b] font-semibold hover:underline">
                See profiles →
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Book an appointment online
              </h3>
              <p className="text-gray-600 mb-6">
                Pick a time that works and share your details with one advisor.
              </p>
              <button className="text-[#ffd54b] font-semibold hover:underline">
                See availability →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-need advisors by city */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Find pre-need advisors by city
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Link
              href="/search?location=Calgary%2C%20AB"
              className="bg-white hover:bg-gray-50 rounded-xl p-6 text-left transition-colors border border-gray-200 hover:border-gray-300 group"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Calgary, AB</h3>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </div>
            </Link>
            <Link
              href="/search?location=Edmonton%2C%20AB"
              className="bg-white hover:bg-gray-50 rounded-xl p-6 text-left transition-colors border border-gray-200 hover:border-gray-300 group"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Edmonton, AB</h3>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Advisors */}
            <div>
              <h3 className="font-semibold text-white mb-4">For Advisors</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/agent" className="hover:text-white transition-colors">
                    List your pre-need practice
                  </Link>
                </li>
                <li>
                  <Link href="/agent/resources" className="hover:text-white transition-colors">
                    Advisor resources
                  </Link>
                </li>
                <li>
                  <Link href="/agent/pricing" className="hover:text-white transition-colors">
                    Pricing
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
              <Link
                href="/agent"
                className="inline-block border-2 border-[#ffd54b] text-[#ffd54b] hover:bg-[#ffd54b] hover:text-gray-900 font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
