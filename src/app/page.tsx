import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const cities = [
    "Calgary",
    "Edmonton",
    "Kelowna",
    "Penticton",
    "Salmon Arm",
  ];

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 md:py-5">
          {/* Logo + Soradin */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-semibold tracking-tight text-[#111111]">Soradin</span>
          </Link>

          {/* Right side nav */}
          <nav className="flex items-center gap-4 md:gap-6">
            <button className="text-sm font-medium text-[#111111] hover:text-soradin-green md:text-base">
              List your service
            </button>
            <button className="rounded-full border-2 border-soradin-green px-4 py-2 text-sm font-semibold text-soradin-green hover:bg-soradin-green hover:text-white transition md:px-6 md:py-2.5 md:text-base">
              Log In
            </button>
          </nav>
        </div>
      </header>

      {/* HERO - Above the fold - Only heading and search */}
      <section className="bg-white min-h-screen flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#111111] sm:text-5xl md:text-6xl">
              Book funeral specialist
            </h1>
          </div>

          {/* 3-box search bar - Zocdoc style pill */}
          <div className="mx-auto max-w-5xl rounded-[999px] bg-white p-2 shadow-lg md:p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
              {/* Search box */}
              <div className="flex-1 px-4 py-3 md:px-6 md:py-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full border-none bg-transparent text-base text-[#111111] outline-none placeholder:text-gray-400 focus:ring-0 md:text-lg"
                />
              </div>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-gray-200 md:block" />

              {/* Location box */}
              <div className="flex-1 px-4 py-3 md:px-6 md:py-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  className="w-full border-none bg-transparent text-base text-[#111111] outline-none placeholder:text-gray-400 focus:ring-0 md:text-lg"
                />
              </div>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-gray-200 md:block" />

              {/* Find Care button */}
              <div className="px-2 py-2 md:px-4 md:py-2">
                <button className="w-full rounded-full border-2 border-soradin-green bg-white px-6 py-3 text-base font-semibold text-soradin-green shadow-sm transition hover:bg-soradin-green hover:text-white md:w-auto md:px-8 md:py-3">
                  Find Care
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO BOXES SECTION - Its own separate page */}
      <section className="min-h-screen border-b border-gray-200 bg-white flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 md:px-6 md:py-32">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Read reviews box */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-6 h-56 w-full rounded-xl bg-[#f5f5f5]">
                {/* Placeholder for illustrated image */}
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span className="text-sm">Illustration placeholder</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#111111]">Read reviews from families</h3>
              <p className="mt-3 text-base text-[#111111]">
                See what other families have to say about their experience with our trusted specialists.
              </p>
              <button className="mt-6 w-fit rounded-full border-2 border-[#111111] bg-white px-6 py-3 text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white transition">
                See reviews
              </button>
            </div>

            {/* Book appointment box */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-6 h-56 w-full rounded-xl bg-[#f5f5f5]">
                {/* Placeholder for illustrated image */}
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span className="text-sm">Illustration placeholder</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#111111]">Book an appointment today</h3>
              <p className="mt-3 text-base text-[#111111]">
                Easily schedule a consultation with a specialist that fits your schedule and needs.
              </p>
              <button className="mt-6 w-fit rounded-full border-2 border-[#111111] bg-white px-6 py-3 text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white transition">
                See availability
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SORADIN FOR SPECIALISTS - Zocdoc style two-column */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Left: Image placeholder */}
            <div className="h-64 rounded-2xl bg-[#f5f5f5] md:h-80">
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-sm">Image placeholder</span>
              </div>
            </div>

            {/* Right: Text content */}
            <div>
              <p className="text-sm font-medium text-[#111111]">Soradin for specialists</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111111] md:text-4xl">
                Are you interested in filling out your calendar?
              </h2>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-soradin-green">•</span>
                  <span className="text-base text-[#111111]">
                    Reach thousands of families with us
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-soradin-green">•</span>
                  <span className="text-base text-[#111111]">
                    Make it easy for families to book with you
                  </span>
                </li>
              </ul>
              <button className="mt-8 rounded-full bg-soradin-green px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-soradin-greenDark md:px-8 md:py-4">
                Learn more about starting with Soradin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY TOP FUNERAL HOMES */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <p className="text-center text-sm font-medium text-[#111111]">Soradin for funeral homes</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[#111111] md:text-4xl">
            Trusted by top funeral homes
          </h2>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Logo placeholders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex h-16 w-32 items-center justify-center rounded-lg border border-gray-200 bg-white md:h-20 md:w-40"
              >
                <span className="text-xs text-gray-400">Logo {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FIND SPECIALIST BY CITY - Zocdoc style */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#111111] md:text-4xl">
            Find Specialist by city
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/search?location=${city}`}
                className="flex items-center justify-between rounded-lg border-b border-gray-300 py-3 text-base font-medium text-[#111111] hover:text-soradin-green transition"
              >
                <span>{city}</span>
                <svg
                  className="h-4 w-4 text-[#111111]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER - Zocdoc style */}
      <footer className="border-t border-gray-200 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-gray-300 md:px-6 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Soradin column */}
            <div>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo - white.png"
                  alt="Soradin Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-base font-semibold text-white">Soradin</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">Home</button>
                </li>
                <li>
                  <button className="hover:text-white">About us</button>
                </li>
                <li>
                  <button className="hover:text-white">Contact us</button>
                </li>
                <li>
                  <button className="hover:text-white">Help</button>
                </li>
              </ul>
            </div>

            {/* Discover column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Discover</p>
              <ul className="mt-4 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">For Families</button>
                </li>
                <li>
                  <button className="hover:text-white">For Specialists</button>
                </li>
                <li>
                  <button className="hover:text-white">How It Works</button>
                </li>
                <li>
                  <button className="hover:text-white">Verified reviews</button>
                </li>
              </ul>
            </div>

            {/* Services column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Services</p>
              <ul className="mt-4 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">Pre-need planning</button>
                </li>
                <li>
                  <button className="hover:text-white">Funeral homes</button>
                </li>
                <li>
                  <button className="hover:text-white">Cremation services</button>
                </li>
                <li>
                  <button className="hover:text-white">Cemetery planning</button>
                </li>
              </ul>
            </div>

            {/* Are you a specialist column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Are you a funeral specialist?
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">List your service on Soradin</button>
                </li>
                <li>
                  <button className="hover:text-white">Learn about Soradin for specialists</button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} Soradin. All rights reserved.
              </p>
              <div className="flex gap-6 text-xs text-gray-500">
                <button className="hover:text-gray-300">Terms</button>
                <button className="hover:text-gray-300">Privacy</button>
                <button className="hover:text-gray-300">Site map</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
