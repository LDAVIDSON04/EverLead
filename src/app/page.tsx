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
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
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
            <span className="text-xl font-semibold tracking-tight text-soradin-text">Soradin</span>
          </Link>

          {/* Right side nav */}
          <nav className="flex items-center gap-4 md:gap-6">
            <button className="text-sm font-medium text-gray-700 hover:text-soradin-green md:text-base">
              List your service
            </button>
            <button className="rounded-full border-2 border-soradin-green px-4 py-2 text-sm font-semibold text-soradin-green hover:bg-soradin-green hover:text-white md:px-6 md:py-2.5 md:text-base">
              Log In
            </button>
          </nav>
        </div>
      </header>

      {/* HERO - Above the fold */}
      <section className="border-b border-gray-100 bg-soradin-bg">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          {/* Subtitle on left */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-soradin-text sm:text-4xl md:text-5xl lg:text-6xl">
              Book local funeral specialists
            </h1>
          </div>

          {/* 3-box search bar */}
          <div className="rounded-2xl bg-white p-4 shadow-lg md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-0">
              {/* Search box */}
              <div className="flex-1 border-b border-gray-200 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full border-none bg-transparent text-base text-soradin-text outline-none placeholder:text-gray-400 focus:ring-0 md:text-lg"
                />
              </div>

              {/* Location box */}
              <div className="flex-1 border-b border-gray-200 pb-4 md:border-b-0 md:border-r md:pb-0 md:px-6">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  className="w-full border-none bg-transparent text-base text-soradin-text outline-none placeholder:text-gray-400 focus:ring-0 md:text-lg"
                />
              </div>

              {/* Find Care button */}
              <div className="pt-2 md:pl-6 md:pt-0">
                <button className="w-full rounded-full border-2 border-soradin-green bg-soradin-green px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-soradin-greenDark hover:border-soradin-greenDark md:w-auto md:px-10 md:py-4">
                  Find Care
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO BOXES SECTION */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-soradin-text md:text-4xl">
            Why choose Soradin?
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Read reviews box */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 h-48 rounded-xl bg-soradin-bg">
                {/* Placeholder for illustrated image */}
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span className="text-sm">Illustration placeholder</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-soradin-text">Read reviews from families</h3>
              <p className="mt-2 text-gray-600">
                See what other families have to say about their experience with our trusted specialists.
              </p>
            </div>

            {/* Book appointment box */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 h-48 rounded-xl bg-soradin-bg">
                {/* Placeholder for illustrated image */}
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span className="text-sm">Illustration placeholder</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-soradin-text">Book an appointment today</h3>
              <p className="mt-2 text-gray-600">
                Easily schedule a consultation with a specialist that fits your schedule and needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SORADIN FOR SPECIALISTS */}
      <section className="border-b border-gray-100 bg-soradin-bg">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-soradin-text md:text-4xl">
              Soradin for specialists
            </h2>
            <p className="mt-4 text-lg text-gray-700 md:text-xl">
              Are you interested in filling out your calendar?
            </p>

            <ul className="mt-8 space-y-4 text-left md:mx-auto md:max-w-md">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-soradin-green">•</span>
                <span className="text-base text-gray-700 md:text-lg">
                  Reach thousands of families with us
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-soradin-green">•</span>
                <span className="text-base text-gray-700 md:text-lg">
                  Make it easy for families to book with you
                </span>
              </li>
            </ul>

            <button className="mt-10 rounded-full border-2 border-soradin-green bg-white px-8 py-3 text-base font-semibold text-soradin-green shadow-sm transition hover:bg-soradin-green hover:text-white md:px-10 md:py-4 md:text-lg">
              Learn more about starting with Soradin
            </button>
          </div>
        </div>
      </section>

      {/* TRUSTED BY TOP FUNERAL HOMES */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-soradin-text md:text-4xl">
            Trusted by top funeral homes
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {/* Logo placeholders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex h-16 w-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 md:h-20 md:w-40"
              >
                <span className="text-xs text-gray-400">Logo {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FIND SPECIALIST BY CITY */}
      <section className="border-b border-gray-100 bg-soradin-bg">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-soradin-text md:text-4xl">
            Find Specialist by city
          </h2>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/search?location=${city}`}
                className="rounded-full border-2 border-soradin-green bg-white px-6 py-3 text-base font-semibold text-soradin-green transition hover:bg-soradin-green hover:text-white md:px-8 md:py-3.5"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-gray-300 md:px-6 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand column */}
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
              <p className="mt-3 text-xs text-gray-400">
                Connecting families with trusted funeral pre-need specialists.
              </p>
            </div>

            {/* Company column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Company</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">About</button>
                </li>
                <li>
                  <button className="hover:text-white">Contact</button>
                </li>
                <li>
                  <button className="hover:text-white">Careers</button>
                </li>
              </ul>
            </div>

            {/* Services column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Services</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">For Families</button>
                </li>
                <li>
                  <button className="hover:text-white">For Specialists</button>
                </li>
                <li>
                  <button className="hover:text-white">How It Works</button>
                </li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Legal</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-300">
                <li>
                  <button className="hover:text-white">Terms of Service</button>
                </li>
                <li>
                  <button className="hover:text-white">Privacy Policy</button>
                </li>
                <li>
                  <button className="hover:text-white">Cookie Policy</button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} Soradin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
