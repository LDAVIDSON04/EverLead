// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fdfaf5] text-slate-900">
      {/* Top nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Soradin
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/for-professionals" className="hover:text-slate-600">
              For professionals
            </Link>
            <Link href="/help" className="hidden hover:text-slate-600 sm:inline">
              Help
            </Link>
            <Link href="/login" className="hidden hover:text-slate-600 sm:inline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-[#fdfaf5] to-[#faf3e7]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center md:py-16">
          {/* Left: copy + search */}
          <div className="max-w-xl space-y-6">
            <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              Book trusted pre-need advisors in Calgary &amp; Edmonton
            </p>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Book local pre-need advisors
              <br />
              and plan ahead with one trusted specialist.
            </h1>

            <p className="text-sm text-slate-600 sm:text-base">
              Soradin helps families in Calgary and Edmonton find pre-need and
              funeral planning specialists. Compare advisors, pick a time that
              works, and share your details securely with one advisor.
            </p>

            {/* Search bar */}
            <div className="rounded-2xl bg-white p-3 shadow-lg shadow-slate-900/5">
              <form
                method="GET"
                action="/search"
                className="flex flex-col gap-3 md:flex-row md:items-center"
              >
                {/* Search term */}
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Search
                  </label>
                  <input
                    name="q"
                    placeholder="Reason for your visit or advisor name"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-0 focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                  />
                </div>

                {/* Location select */}
                <div className="w-full md:w-56">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Location
                  </label>
                  <select
                    name="location"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
                    defaultValue="Calgary, AB"
                    required
                  >
                    <option value="Calgary, AB">Calgary, AB</option>
                    <option value="Edmonton, AB">Edmonton, AB</option>
                  </select>
                </div>

                {/* Button */}
                <div className="flex w-full md:w-auto md:items-end">
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 md:w-36"
                  >
                    Find advisors
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: illustration placeholder */}
          <div className="flex flex-1 items-center justify-center">
            <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-3xl bg-sky-50 text-center text-xs text-slate-400">
              Future Soradin artwork
            </div>
          </div>
        </div>
      </section>

      {/* Trusted providers */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold text-slate-900">
          Find pre-need advisors from trusted providers
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Connect with local funeral homes, cemeteries, and pre-need specialists
          in Calgary and Edmonton.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            "Funeral homes",
            "Cemeteries",
            "Cremation services",
            "Pre-need insurance specialists",
          ].map((label) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl bg-white px-4 py-5 text-center text-sm shadow-sm shadow-slate-900/5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-600">
                {label[0]}
              </div>
              <span className="font-medium text-slate-800">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top-searched services */}
      <section className="border-y border-slate-100 bg-[#faf3e7] py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Top-searched pre-need services
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
                className="flex flex-col items-center rounded-2xl bg-white px-3 py-4 text-center text-xs shadow-sm shadow-slate-900/5"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-600">
                  {service[0]}
                </div>
                <span className="text-slate-800">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#f7f0e4] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-center text-xl font-semibold text-slate-900">
            How Soradin works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Browse advisors in your area",
                body: "View pre-need specialists in Calgary and Edmonton and see who offers the type of planning you need.",
                cta: "See advisors",
              },
              {
                title: "Learn about their expertise",
                body: "Read bios, experience, and focus areas to find the advisor who fits your family best.",
                cta: "See profiles",
              },
              {
                title: "Book an appointment online",
                body: "Choose a time that works and share your details securely with one advisor.",
                cta: "See availability",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="flex flex-col rounded-2xl bg-white px-5 py-6 shadow-sm shadow-slate-900/5"
              >
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="flex-1 text-sm text-slate-600">{card.body}</p>
                <button className="mt-4 inline-flex w-max items-center rounded-full border border-sky-500 px-4 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50">
                  {card.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="bg-[#fdfaf5] py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Find pre-need advisors by city
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Calgary, AB", "Edmonton, AB"].map((city) => (
              <Link
                key={city}
                href={`/search?location=${encodeURIComponent(city)}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-800 hover:border-sky-400 hover:shadow-sm"
              >
                <span>{city}</span>
                <span className="text-slate-400">›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-10 text-sm text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between">
          <div className="space-y-3">
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

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">
              For professionals
            </h3>
            <div className="flex flex-col gap-1">
              <Link href="/for-professionals" className="hover:text-white">
                List your pre-need practice
              </Link>
              <Link href="/pricing" className="hover:text-white">
                Soradin pricing
              </Link>
              <Link href="/resources" className="hover:text-white">
                Advisor resources
              </Link>
            </div>
          </div>

          <div className="space-y-3">
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
            <p className="text-xs text-slate-400">
              Join Soradin to reach families planning ahead in Calgary and
              Edmonton.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full border border-sky-400 px-4 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-600/20"
            >
              Get started
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Soradin. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
