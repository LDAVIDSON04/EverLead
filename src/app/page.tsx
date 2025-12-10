// app/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const cities = [
    ["Calgary", "Edmonton", "Kelowna"],
    ["Penticton", "Salmon Arm", "Vernon"],
  ];

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-gray-900">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-semibold tracking-tight">
              Soradin
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-gray-600 md:flex">
            <button className="hover:text-gray-900">For families</button>
            <button className="hover:text-gray-900">For specialists</button>
            <button className="hover:text-gray-900">How it works</button>
            <button className="hover:text-gray-900">Help</button>
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden text-sm text-gray-700 hover:text-gray-900 md:inline-block">
              List your service
            </button>
            <button className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-white to-[#F5F7FA]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-center lg:px-6 lg:py-20">
          {/* Left: copy + search */}
          <div className="flex-1 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Book funeral specialist
              </h1>
              <p className="max-w-xl text-base text-gray-600 sm:text-lg">
                Find local pre-need advisors recommended by families in your
                community. Compare options, read reviews, and book in minutes.
              </p>
            </div>

            {/* Search bar */}
            <div className="rounded-full bg-white shadow-lg shadow-gray-200/60 ring-1 ring-gray-200">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-2">
                <div className="flex-1 px-2 sm:px-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Search
                  </div>
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    className="mt-1 w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                </div>

                <div className="hidden h-10 w-px bg-gray-200 sm:block" />

                <div className="flex-1 px-2 sm:px-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Location
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="mt-1 w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                </div>

                <div className="sm:pl-2">
                  <button className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 sm:mt-0 sm:w-auto">
                    Find care
                  </button>
                </div>
              </div>
            </div>

            {/* Small reassurance line */}
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                ✓
              </span>
              No spam. Your details are only shared with the specialist you
              choose.
            </p>
          </div>

          {/* Right: soft image placeholder */}
          <div className="flex-1">
            <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-slate-100 shadow-lg shadow-gray-200/80 sm:h-72 lg:h-80">
              <div className="absolute inset-6 rounded-2xl border border-dashed border-emerald-100 bg-white/60 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-emerald-600/10 px-4 py-1 text-xs font-medium text-emerald-700">
                  Hero image placeholder
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALISTS SECTION */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-6">
          {/* Left: image placeholder */}
          <div className="flex items-center">
            <div className="h-64 w-full rounded-3xl bg-gray-100 shadow-inner lg:h-72">
              <div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">
                Image / illustration placeholder
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Soradin for specialists
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Are you interested in filling out your calendar?
              </h2>
            </div>

            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Reach thousands of families searching in your region.</li>
              <li>• Make it easy for families to book with you online.</li>
              <li>• Stay in control of your schedule and pricing.</li>
            </ul>

            <div>
              <button className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Learn more about starting with Soradin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="border-b border-gray-200 bg-[#F5F7FA]">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Soradin for funeral homes
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            Trusted by top funeral homes
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {["Logo 1", "Logo 2", "Logo 3", "Logo 4", "Logo 5"].map(
              (label) => (
                <div
                  key={label}
                  className="flex h-20 items-center justify-center rounded-2xl border border-gray-200 bg-white text-xs text-gray-400"
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* FIND BY CITY */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
            Find specialist by city
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Start by choosing the city where you&apos;re planning services.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {cities.map((col, colIdx) => (
              <div key={colIdx} className="space-y-3">
                {col.map((city) => (
                  <button
                    key={city}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:border-emerald-500 hover:bg-emerald-50"
                  >
                    <span>{city}</span>
                    <span className="text-xs text-gray-400">View advisors</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEW + BOOK CARDS */}
      <section className="bg-[#F5F7FA]">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Reviews card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-gray-200">
              <div className="h-32 rounded-2xl bg-gray-100">
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  Illustration placeholder
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  Read reviews from families
                </h4>
                <p className="text-sm text-gray-600">
                  See what other families have to say about their experience
                  with our trusted specialists before you decide.
                </p>
              </div>
              <button className="mt-4 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                See reviews
              </button>
            </div>

            {/* Book card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-gray-200">
              <div className="h-32 rounded-2xl bg-gray-100">
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  Illustration placeholder
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  Book an appointment today
                </h4>
                <p className="text-sm text-gray-600">
                  Easily schedule a consultation with a specialist that fits
                  your schedule and needs.
                </p>
              </div>
              <button className="mt-4 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
                See availability
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-black text-gray-300">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo - white.png"
                  alt="Soradin Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm font-semibold text-white">
                  Soradin
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Helping families and funeral professionals connect with
                confidence.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <h5 className="mb-1 font-semibold text-white">Discover</h5>
              <button className="block text-left text-gray-400 hover:text-white">
                For families
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                For specialists
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                How it works
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                Verified reviews
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <h5 className="mb-1 font-semibold text-white">Services</h5>
              <button className="block text-left text-gray-400 hover:text-white">
                Pre-need planning
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                Funeral homes
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                Cremation services
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                Cemetery planning
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <h5 className="mb-1 font-semibold text-white">
                Are you a funeral specialist?
              </h5>
              <button className="block text-left text-gray-400 hover:text-white">
                List your service on Soradin
              </button>
              <button className="block text-left text-gray-400 hover:text-white">
                Learn about Soradin for specialists
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-500 sm:flex-row">
            <span>© {new Date().getFullYear()} Soradin. All rights reserved.</span>
            <div className="flex gap-4">
              <button className="hover:text-gray-300">Terms</button>
              <button className="hover:text-gray-300">Privacy</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
