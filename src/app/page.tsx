// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8">
        {/* Top bar */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight">
              EverLead
            </span>
            <span className="text-xs text-slate-500">
              Pre-need lead marketplace
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/get-started" className="text-slate-700 hover:text-brand-600">
              Get started
            </Link>
            <Link href="/login" className="text-slate-700 hover:text-brand-600">
              Agent login
            </Link>
          </nav>
        </header>

        {/* Hero section */}
        <section className="grid gap-10 md:grid-cols-[3fr_2fr] md:items-center">
          <div>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Zillow-style{" "}
              <span className="text-brand-600">pre-need leads</span> for
              funeral professionals.
            </h1>
            <p className="mb-5 text-sm text-slate-600 md:text-base">
              Families answer a short pre-planning questionnaire. EverLead
              turns those responses into qualified leads your team can buy
              instantly or bid on, just like Zillow or eBay — with a{" "}
              <span className="font-semibold">first lead free</span>.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-started"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
              >
                I&apos;m a family – start my plan
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:border-brand-500 hover:text-brand-700"
              >
                I&apos;m an agent – log in
              </Link>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              First agent lead is free. After that, pay per lead securely with
              Stripe.
            </p>
          </div>

          {/* Right side "feature card" */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              For funeral sales teams
            </p>
            <h2 className="mb-3 text-base font-semibold text-slate-900">
              Stop waiting for the phone to ring.
            </h2>

            <ul className="mb-3 list-disc space-y-1 pl-4 text-xs text-slate-700 md:text-sm">
              <li>Families fill out a guided pre-need questionnaire.</li>
              <li>
                Leads are tagged HOT / WARM / COLD with contact details and
                preferences.
              </li>
              <li>Agents can bid or hit Buy Now to lock in exclusivity.</li>
              <li>
                Admins see total leads, revenue, and performance from one
                dashboard.
              </li>
            </ul>

            <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-slate-600">
              <div>
                <div className="text-[10px] uppercase tracking-wide">
                  Typical commission
                </div>
                <div className="text-sm font-semibold">$300+ per sale</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide">
                  Lead pricing
                </div>
                <div className="text-sm font-semibold">$10–$50 per hot lead</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide">
                  Your risk
                </div>
                <div className="text-sm font-semibold">First lead is free</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
