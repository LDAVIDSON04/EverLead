// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Plan ahead. Protect your family.
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/get-started"
              className="rounded-full bg-brand-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Start planning
            </Link>
            <Link
              href="/agent"
              className="text-xs text-slate-700 hover:text-brand-600"
            >
              For agents
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero section – for families */}
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-700">
            For families planning ahead
          </p>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Make your funeral wishes clear{" "}
            <span className="text-brand-600">long before you need them.</span>
          </h1>

          <p className="mb-6 max-w-xl text-sm text-slate-600 md:text-base">
            Answer a simple set of questions about your wishes, budget, and
            preferences. We organise everything into a clear plan and connect
            you with a trusted pre-planning professional when you&apos;re
            ready—so your family isn&apos;t making every decision on the
            hardest day of their lives.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/get-started"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Start the planning questionnaire
            </Link>
            <a
              href="#how-it-works"
              className="text-sm text-slate-700 hover:text-brand-600"
            >
              See how it works
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            No obligation to buy today. Share your wishes now, make decisions
            at your own pace.
          </p>
        </div>

        {/* Right column – reassurance card */}
        <div className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Why plan ahead?
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-4 text-xs text-slate-700 md:text-sm">
              <li>Reduce stress for your family during a difficult time.</li>
              <li>
                Record your preferences for service type, burial or cremation,
                music, and more.
              </li>
              <li>
                Get upfront information on costs and payment options before
                anything is urgent.
              </li>
              <li>
                Connect with a local pre-planning specialist only when you&apos;re
                comfortable.
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-[11px] text-slate-600">
              <div>
                <div className="uppercase tracking-wide text-slate-500">
                  Takes about
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  5–10 minutes
                </div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-slate-500">
                  Cost to start
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Free planning questionnaire
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section
        id="how-it-works"
        className="mx-auto max-w-5xl px-4 pb-12 pt-2 md:pb-16"
      >
        <h2 className="mb-4 text-base font-semibold text-slate-900 md:text-lg">
          How EverLead works for families
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 1
            </div>
            <p className="font-semibold">Answer a few gentle questions.</p>
            <p className="mt-1 text-xs text-slate-600">
              We ask about preferences, faith or traditions, budget, and who
              should be involved—at your own pace.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 2
            </div>
            <p className="font-semibold">We build your planning summary.</p>
            <p className="mt-1 text-xs text-slate-600">
              Your answers are organised into a clear summary you can save,
              share, or update later.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step 3
            </div>
            <p className="font-semibold">
              Connect with a local pre-planning specialist.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              When you&apos;re ready, we match you with a licensed professional
              who can walk through options and plans with you.
            </p>
          </div>
        </div>
      </section>

      {/* Tiny note for agents at the bottom */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">
              Are you a funeral professional?
            </span>{" "}
            EverLead also provides a lead marketplace for licensed pre-need
            counselors and funeral homes.
          </p>
          <Link
            href="/agent"
            className="mt-1 inline-flex text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Visit the agent portal →
          </Link>
        </div>
      </section>
    </main>
  );
}
