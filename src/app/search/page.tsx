"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "Calgary, AB";

  return (
    <main className="min-h-screen bg-[#fffaf1]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-3 md:py-5">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <span className="text-lg md:text-xl font-light tracking-wide text-gray-900">
              ← Back to Soradin
            </span>
          </Link>
        </div>
      </header>

      {/* Search Results Content */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Search Results
            </h1>
            <p className="text-gray-600">
              {query ? `Searching for "${query}"` : "Showing all results"} in {location}
            </p>
          </div>

          {/* Placeholder for future search results */}
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">
              Search functionality coming soon. This page will display pre-need advisors matching your criteria.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#ffd54b] hover:bg-[#ffcc00] text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#fffaf1] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    }>
      <SearchResults />
    </Suspense>
  );
}

