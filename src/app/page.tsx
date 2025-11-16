// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-rose-50/30 to-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Pre-planning, with care
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <a
              href="#how-it-works"
              className="hidden text-xs text-slate-700 hover:text-slate-900 md:inline"
            >
              How it works
            </a>
            <a
              href="#learning"
              className="hidden text-xs text-slate-700 hover:text-slate-900 md:inline"
            >
              Learning center
            </a>
            <Link
              href="/get-started"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Start planning
            </Link>
            <Link
              href="/agent"
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
            >
              For agents
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200/60 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:py-16">
          {/* Left: copy */}
          <div className="flex-1">
            <p className="mb-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-700">
              For families planning ahead
            </p>

            <h1 className="mb-4 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              A calm way to{" "}
              <span className="underline decoration-rose-200 decoration-2 underline-offset-4">
                record your wishes
              </span>{" "}
              long before anyone has to guess.
            </h1>

            <p className="mb-6 max-w-xl text-sm text-slate-600 md:text-base">
              EverLead guides you through a gentle, step-by-step conversation
              about your funeral wishes. We turn your answers into a clear
              plan and, when you&apos;re ready, connect you with a trusted
              pre-planning specialist—so your family isn&apos;t left making
              every decision on the hardest day.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/get-started"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Start the planning questionnaire
              </Link>
              <a
                href="#overview-video"
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-[11px]">
                  ▶
                </span>
                Watch a 2-minute overview
              </a>
            </div>

            <p className="mt-4 text-[11px] text-slate-500">
              No obligation, no payment required to plan. You can start now and
              save your answers to revisit later.
            </p>
          </div>

          {/* Right: "video" & info card */}
          <div className="flex-1 space-y-4">
            {/* Video highlight card */}
            <div
              id="overview-video"
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-slate-50 shadow-lg"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f97373_0,_transparent_55%),radial-gradient(circle_at_bottom,_#38bdf8_0,_transparent_55%)] opacity-50" />
              <div className="relative p-4 md:p-5">
                <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-rose-100">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    ▶
                  </span>
                  Explainer video
                </div>
                <p className="mb-2 text-sm font-semibold md:text-base">
                  "What does funeral pre-planning actually involve?"
                </p>
                <p className="mb-3 text-xs text-slate-200 md:text-sm">
                  A gentle walkthrough of the choices families usually face,
                  what can be decided ahead of time, and how EverLead helps
                  you organise everything.
                </p>
                <p className="text-[11px] text-slate-300">
                  In your real site this area can be a YouTube or Vimeo embed
                  of your own video content.
                </p>
              </div>
            </div>

            {/* Flyers / resources row */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-4 text-xs text-rose-900">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">
                  Printable guide
                </div>
                <p className="font-medium">
                  "Conversation starters for talking with your family."
                </p>
                <p className="mt-1 text-[11px]">
                  A one-page PDF you can download, print, and bring to the
                  table when you&apos;re ready to talk.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Planning checklist
                </div>
                <p className="font-medium">
                  All the key decisions, in one place.
                </p>
                <p className="mt-1 text-[11px]">
                  Service type, music, readings, burial or cremation, and more
                  — organised into a calm, simple checklist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-10 md:py-14"
      >
        <div className="mb-6 max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
            How EverLead works for your family
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We keep the process simple, gentle, and at your own pace. No sales
            pressure, no countdown timers—just clarity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
              1
            </div>
            <p className="font-semibold text-slate-900">
              Answer a few gentle questions.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              We ask about preferences, faith or traditions, budget, and who
              should be involved — always in plain, human language.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
              2
            </div>
            <p className="font-semibold text-slate-900">
              We create a clear planning summary.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Your answers are organised into a simple summary you can save,
              print, or share with the people you trust.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
              3
            </div>
            <p className="font-semibold text-slate-900">
              Connect with a local pre-planning specialist.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              When you&apos;re ready—not before—EverLead connects you with a
              licensed professional who can walk through options with you.
            </p>
          </div>
        </div>
      </section>

      {/* Learning center / "videos" + FAQ */}
      <section
        id="learning"
        className="border-t border-slate-200 bg-white/80"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-[1.4fr,1fr]">
            {/* Learning cards */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                Learn at your own pace
              </h2>
              <p className="mt-2 mb-4 text-sm text-slate-600">
                Short, clear explainers you can watch or read before you make
                any decisions.
              </p>

              <div className="space-y-3">
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                    ▶
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Video · What does a pre-arranged funeral actually cover?
                    </p>
                    <p className="text-xs text-slate-600">
                      A gentle explanation of services, costs, and what can be
                      decided in advance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                    📄
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      PDF · Questions to ask a funeral home before you sign.
                    </p>
                    <p className="text-xs text-slate-600">
                      A printable checklist you can bring to any appointment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                    💬
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Guide · How to talk with your family about your wishes.
                    </p>
                    <p className="text-xs text-slate-600">
                      Simple language and prompts to start a calm conversation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                Common questions
              </h2>
              <dl className="mt-3 space-y-3 text-xs text-slate-700">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-900">
                    Do I have to buy anything to use EverLead?
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    No. You can complete the questionnaire and create a
                    planning summary without making any purchase. Connecting
                    with a professional is optional and always at your pace.
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-900">
                    Will my information be shared with lots of companies?
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    No. When you choose to be contacted, we connect you with a
                    small number of carefully selected professionals, not a
                    public list.
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="font-semibold text-slate-900">
                    Can I change my mind later?
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    Your wishes can be updated over time. EverLead is designed
                    to help you start the conversation, not lock you into
                    something before you&apos;re ready.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} EverLead. Gentle tools for planning
            ahead.
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-slate-800">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              Terms
            </Link>
            <span className="text-slate-400">
              EverLead is not a funeral home and does not provide legal advice.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
