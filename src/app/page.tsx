// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-soradin-bg text-soradin-text">
      {/* Top nav */}
      <header className="w-full border-b border-gray-200 bg-soradin-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soradin-text text-xs font-semibold text-soradin-bg">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Soradin
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-sm">
            <button className="hidden items-center gap-1 text-gray-700 hover:text-soradin-text sm:flex">
              <span>Browse</span>
              <span className="text-xs">▾</span>
            </button>
            <Link href="/help" className="hidden text-gray-700 hover:text-soradin-text sm:inline">
              Help
            </Link>
            <Link
              href="/for-professionals"
              className="hidden text-gray-700 hover:text-soradin-text md:inline"
            >
              List your practice on Soradin
            </Link>
            <Link href="/login" className="hidden text-gray-700 hover:text-soradin-text sm:inline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-soradin-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-soradin-greenDark"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO — match Zocdoc spacing/layout */}
      <section className="border-b border-gray-200 bg-soradin-bg">
        <div className="mx-auto flex max-w-6xl flex-col px-6 pt-16 pb-20">
          {/* Heading block */}
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-soradin-text md:text-5xl">
              Book local funeral professionals near you.
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl">
              Compare trusted funeral homes, cemeteries, and pre-need advisors in your area.
            </p>
          </div>

          {/* Search bar - Zocdoc style */}
          <div className="mt-8 w-full max-w-5xl">
            <div className="rounded-full bg-white shadow-md flex flex-col md:flex-row md:items-stretch overflow-hidden">
              <form
                method="GET"
                action="/search"
                className="flex flex-col w-full md:flex-row md:items-stretch"
              >
                {/* Service column */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-3">
                  <label className="text-xs font-medium text-gray-500">Service</label>
                  <input
                    name="q"
                    className="w-full border-none p-0 mt-1 text-sm text-soradin-text focus:outline-none focus:ring-0"
                    placeholder="Funeral home, cemetery, insurance..."
                  />
                </div>

                {/* Location column */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-3">
                  <label className="text-xs font-medium text-gray-500">Location</label>
                  <select
                    name="location"
                    defaultValue="Calgary, AB"
                    className="w-full border-none p-0 mt-1 text-sm text-soradin-text bg-transparent focus:outline-none focus:ring-0"
                  >
                    <option value="Calgary, AB">Calgary, AB</option>
                    <option value="Edmonton, AB">Edmonton, AB</option>
                  </select>
                </div>

                {/* Planning for column */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 px-4 py-3">
                  <label className="text-xs font-medium text-gray-500">Planning for</label>
                  <select
                    name="reason"
                    className="w-full border-none p-0 mt-1 text-sm text-soradin-text bg-transparent focus:outline-none focus:ring-0"
                  >
                    <option value="">Myself, parent, partner...</option>
                    <option value="self">Myself</option>
                    <option value="parent">Parent</option>
                    <option value="partner">Partner</option>
                    <option value="relative">Another relative</option>
                  </select>
                </div>

                {/* Button column */}
                <button
                  type="submit"
                  className="md:w-40 px-6 py-3 bg-soradin-green text-white text-sm font-semibold hover:bg-soradin-greenDark"
                >
                  Find advisors
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* BAND: Find advisors from trusted providers */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold text-soradin-text">
            Find pre-need advisors from trusted providers
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            Connect with local funeral homes, cemeteries, and pre-need specialists in
            Calgary and Edmonton.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {["Funeral homes", "Cemeteries", "Cremation services", "Pre-need insurance"].map(
              (label) => (
                <button
                  key={label}
                  className="flex items-center justify-center rounded-2xl border border-gray-200 bg-soradin-bg px-4 py-5 text-center text-sm font-medium text-soradin-text hover:border-soradin-green"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Top-searched pre-need services */}
      <section className="border-t border-gray-200 bg-soradin-bg py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold text-soradin-text">
            Top-searched pre-need services
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              "Planning for myself",
              "Planning for parents",
              "Planning for a partner",
              "Planning for another relative",
              "Cremation pre-planning",
              "Burial & cemetery pre-planning",
            ].map((service) => (
              <div
                key={service}
                className="flex flex-col items-center rounded-2xl bg-white px-4 py-6 text-center text-sm text-soradin-text shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-soradin-green text-xs font-semibold text-white">
                  {service[0]}
                </div>
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find advisors by city */}
      <section className="bg-soradin-bg py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-xl font-semibold text-soradin-text">
            Find pre-need advisors by city
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {["Calgary, AB", "Edmonton, AB"].map((city) => (
              <button
                key={city}
                className="flex items-center justify-between border-b border-gray-200 py-3 text-sm text-soradin-text hover:text-soradin-green"
              >
                <span>{city}</span>
                <span className="text-xs text-gray-500">▾</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#2b2b2b] py-10 text-sm text-[#f7f0d7]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Soradin</h3>
              <div className="flex flex-col gap-1">
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
                <Link href="/about" className="hover:text-white">
                  About us
                </Link>
                <Link href="/contact" className="hover:text-white">
                  Contact us
                </Link>
                <Link href="/help" className="hover:text-white">
                  Help
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Discover</h3>
              <div className="flex flex-col gap-1">
                <Link href="/resources/families" className="hover:text-white">
                  Planning guides for families
                </Link>
                <Link href="/resources/advisors" className="hover:text-white">
                  Practice resources for advisors
                </Link>
                <Link href="/community" className="hover:text-white">
                  Community standards
                </Link>
                <Link href="/privacy" className="hover:text-white">
                  Data and privacy
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Pre-need providers</h3>
              <div className="flex flex-col gap-1">
                <Link href="/providers" className="hover:text-white">
                  For funeral homes
                </Link>
                <Link href="/providers/cemeteries" className="hover:text-white">
                  For cemeteries
                </Link>
                <Link href="/providers/insurance" className="hover:text-white">
                  For pre-need insurers
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Legal</h3>
              <div className="flex flex-col gap-1">
                <Link href="/terms" className="hover:text-white">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-white">
                  Privacy
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">
                Are you a pre-need specialist?
              </h3>
              <p className="text-xs text-[#d7cba8]">
                Join Soradin to reach families planning ahead in Calgary and Edmonton.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-soradin-green px-4 py-2 text-xs font-semibold text-white hover:bg-soradin-greenDark"
              >
                Get started
              </Link>
            </div>
          </div>

          <p className="mt-8 text-xs text-[#b8ad92]">
            The content provided here and elsewhere on the Soradin site is provided for
            general informational purposes only. It is not intended as, and Soradin does
            not provide, legal, financial, or medical advice. Always contact a qualified
            professional directly with any questions you may have regarding your planning
            needs.
          </p>

          <p className="mt-4 text-xs text-[#b8ad92]">© {year} Soradin. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
