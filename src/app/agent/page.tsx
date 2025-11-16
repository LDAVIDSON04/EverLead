// src/app/agent/page.tsx
import Link from "next/link";

export default function AgentLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              EverLead
            </Link>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Agent portal
            </span>
          </div>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-brand-600"
            >
              For families
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-center">
        {/* Left – pitch to agents */}
        <div className="flex-1">
          <p className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-700">
            For funeral sales professionals
          </p>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Turn pre-need into a steady pipeline of{" "}
            <span className="text-brand-600">warm conversations.</span>
          </h1>

          <p className="mb-5 max-w-xl text-sm text-slate-600 md:text-base">
            EverLead collects pre-need interest from families through a guided
            questionnaire, then delivers qualified leads directly to your agent
            dashboard. Buy now or bid on leads, track your results, and stop
            waiting for the phone to ring.
          </p>

          <ul className="mb-6 list-disc space-y-1 pl-4 text-xs text-slate-700 md:text-sm">
            <li>First lead free for every new agent.</li>
            <li>Buy Now or auction-style bidding on exclusive leads.</li>
            <li>Leads tagged HOT / WARM / COLD with contact details.</li>
            <li>Simple dashboard with your leads and performance stats.</li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Log in or create agent account
            </Link>
            <Link
              href="/agent#how-it-works-agents"
              className="text-sm text-slate-700 hover:text-brand-600"
            >
              How the marketplace works
            </Link>
          </div>
        </div>

        {/* Right – simple ROI card */}
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Example from a top pre-need counselor
            </p>
            <p className="mb-3 text-sm font-semibold text-slate-900">
              If you close ~30% of your leads and average $300+ commission per
              sale:
            </p>

            <ul className="mb-4 list-disc space-y-1 pl-4 text-xs text-slate-700 md:text-sm">
              <li>100 purchased leads → ~30 sales → ~$9,000 commission.</li>
              <li>Lead cost $10–$50 → strong return on each closed case.</li>
              <li>
                You only pay for leads you choose to work—no monthly contract
                required (for now).
              </li>
            </ul>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-[11px] text-slate-600">
              <div>
                <div className="uppercase tracking-wide text-slate-500">
                  Lead types
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Hot, warm & cold
                </div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-slate-500">
                  First lead
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Free when you join
                </div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-slate-500">
                  Access
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Web dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works for agents */}
      <section
        id="how-it-works-agents"
        className="mx-auto max-w-5xl px-4 pb-12 pt-2 md:pb-16"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-900 md:text-lg">
          How EverLead works for agents
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 1
            </div>
            <p className="font-semibold">Create your agent account.</p>
            <p className="mt-1 text-xs text-slate-600">
              Sign up with your work email, add your funeral home or territory,
              and claim your first free lead.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 2
            </div>
            <p className="font-semibold">Browse and buy leads.</p>
            <p className="mt-1 text-xs text-slate-600">
              Filter by urgency and location, then use Buy Now or bidding to
              secure exclusive leads in your area.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 3
            </div>
            <p className="font-semibold">Work the cases & track results.</p>
            <p className="mt-1 text-xs text-slate-600">
              Contact families, document outcomes, and see how your investment
              in leads turns into closed pre-need plans.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

