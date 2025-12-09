// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#fff7e2] text-slate-900">
      {/* Top nav */}
      <header className="w-full border-b border-[#f0e2b5] bg-[#fff7e2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-[#fff7e2]">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Soradin
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-sm">
            <button className="hidden items-center gap-1 text-slate-700 hover:text-slate-900 sm:flex">
              <span>Browse</span>
              <span className="text-xs">▾</span>
            </button>
            <Link href="/help" className="hidden text-slate-700 hover:text-slate-900 sm:inline">
              Help
            </Link>
            <Link
              href="/for-professionals"
              className="hidden text-slate-700 hover:text-slate-900 md:inline"
            >
              List your practice on Soradin
            </Link>
            <Link href="/login" className="hidden text-slate-700 hover:text-slate-900 sm:inline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#ffd94a] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[#ffcf1d]"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO — match Zocdoc spacing/layout */}
      <section className="border-b border-[#f0e2b5] bg-[#fff7e2]">
        <div className="mx-auto flex max-w-6xl flex-col px-6 pt-16 pb-20">
          {/* Heading block */}
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Book local funeral professionals near you.
            </h1>
          </div>

          {/* Search bar */}
          <div className="mt-8 w-full max-w-5xl">
            <div className="rounded-[999px] bg-white shadow-lg shadow-slate-900/5">
              <form
                method="GET"
                action="/search"
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center"
              >
                {/* Search column */}
                <div className="flex-1 min-w-[180px]">
                  <div className="text-xs font-medium text-slate-500">Search</div>
                  <input
                    name="q"
                    placeholder="Reason for your visit or advisor name"
                    className="mt-1 h-10 w-full rounded-md border border-transparent bg-[#f7f5f0] px-3 text-sm text-slate-900 outline-none focus:border-[#ffd94a] focus:bg-white"
                  />
                </div>

                {/* Location column */}
                <div className="w-full min-w-[180px] md:w-52">
                  <div className="text-xs font-medium text-slate-500">Location</div>
                  <select
                    name="location"
                    defaultValue="Calgary, AB"
                    className="mt-1 h-10 w-full rounded-md border border-transparent bg-[#f7f5f0] px-3 text-sm text-slate-900 outline-none focus:border-[#ffd94a] focus:bg-white"
                  >
                    <option value="Calgary, AB">Calgary, AB</option>
                    <option value="Edmonton, AB">Edmonton, AB</option>
                  </select>
                </div>

                {/* Planning for column */}
                <div className="w-full min-w-[200px] md:w-64">
                  <div className="text-xs font-medium text-slate-500">Planning for</div>
                  <select
                    name="reason"
                    className="mt-1 h-10 w-full rounded-md border border-transparent bg-[#f7f5f0] px-3 text-sm text-slate-900 outline-none focus:border-[#ffd94a] focus:bg-white"
                  >
                    <option value="">Select a reason (optional)</option>
                    <option value="self">Myself</option>
                    <option value="parent">Parent</option>
                    <option value="partner">Partner</option>
                    <option value="relative">Another relative</option>
                  </select>
                </div>

                {/* Button column */}
                <div className="flex w-full justify-end md:w-40">
                  <button
                    type="submit"
                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ffd94a] px-6 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[#ffcf1d] md:mt-6"
                  >
                    <span className="text-sm">🔍</span>
                    <span>Find advisors</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* BAND: Find advisors from trusted providers */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Find pre-need advisors from trusted providers
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Connect with local funeral homes, cemeteries, and pre-need specialists in
            Calgary and Edmonton.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {["Funeral homes", "Cemeteries", "Cremation services", "Pre-need insurance"].map(
              (label) => (
                <button
                  key={label}
                  className="flex items-center justify-center rounded-2xl border border-[#f2e5b2] bg-[#fff9e5] px-4 py-5 text-center text-sm font-medium text-slate-900 hover:border-slate-800"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Top-searched pre-need services */}
      <section className="border-t border-[#f0e2b5] bg-[#fff7e2] py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold text-slate-900">
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
                className="flex flex-col items-center rounded-2xl bg-[#ffeeb8] px-4 py-6 text-center text-sm text-slate-900"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900">
                  {service[0]}
                </div>
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find advisors by city */}
      <section className="bg-[#fff7e2] py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Find pre-need advisors by city
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {["Calgary, AB", "Edmonton, AB"].map((city) => (
              <button
                key={city}
                className="flex items-center justify-between border-b border-[#f0e2b5] py-3 text-sm text-slate-900"
              >
                <span>{city}</span>
                <span className="text-xs text-slate-500">▾</span>
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
                className="inline-flex items-center rounded-full bg-[#ffd94a] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#ffcf1d]"
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
