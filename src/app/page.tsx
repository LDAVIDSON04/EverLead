// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f2ec] text-slate-900">
      {/* Top bar */}
      <header className="border-b border-[#d4c6a8] bg-[#1f2933] text-[#fdfaf4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              Pre-arrangement &amp; planning
            </span>
          </div>

          <nav className="flex items-center gap-5 text-xs font-medium">
            <a
              href="#about"
              className="hidden text-[#e0d5bf] hover:text-white md:inline"
            >
              About
            </a>
            <a
              href="#services"
              className="hidden text-[#e0d5bf] hover:text-white md:inline"
            >
              Planning options
            </a>
            <a
              href="#resources"
              className="hidden text-[#e0d5bf] hover:text-white md:inline"
            >
              Resources
            </a>
            <Link
              href="/get-started"
              className="rounded-full border border-[#e5d7b5] bg-[#fdfaf4] px-4 py-2 text-[11px] font-semibold text-[#1f2933] shadow-sm hover:bg-white"
            >
              Start planning
            </Link>
            <Link
              href="/agent"
              className="text-[11px] font-medium text-[#e0d5bf] hover:text-white"
            >
              For agents
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero banner */}
      <section className="border-b border-[#e0d5bf] bg-[#111827]">
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          {/* Fake background image layer (replace with real photo later) */}
          <div className="absolute inset-0 -mx-4 overflow-hidden opacity-40">
            <div className="h-full w-full bg-[url('/hero-placeholder.jpg')] bg-cover bg-center" />
          </div>

          {/* Overlay to keep text readable */}
          <div className="absolute inset-0 -mx-4 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/50" />

          {/* Content */}
          <div className="relative grid gap-10 md:grid-cols-[1.4fr,1fr]">
            <div className="text-[#fdfaf4]">
              <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2e8cf]">
                For families planning ahead
              </p>

              <h1
                className="mb-4 text-3xl font-semibold leading-tight md:text-4xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                A gentle, organised way to record your funeral wishes in
                advance.
              </h1>

              <p className="mb-6 max-w-xl text-sm text-[#f3ede0] md:text-base">
                EverLead helps you note your preferences, gather important
                details, and connect with a trusted pre-arrangement
                specialist—so your family isn&apos;t left guessing on the
                hardest day.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/get-started"
                  className="rounded-full bg-[#fdfaf4] px-5 py-2.5 text-sm font-semibold text-[#1f2933] shadow-sm hover:bg-white"
                >
                  Begin the planning questionnaire
                </Link>
                <a
                  href="#video"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#f3ede0] hover:text-white"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f3ede0] text-[11px]">
                    ▶
                  </span>
                  Watch a short introduction
                </a>
              </div>

              <p className="mt-4 text-[11px] text-[#e0d5bf]">
                No cost or obligation to use EverLead. You can save your
                answers and return to them at any time.
              </p>
            </div>

            {/* Right-hand "video" + reassurance card */}
            <div className="space-y-4">
              <div
                id="video"
                className="overflow-hidden rounded-xl border border-[#d4c6a8] bg-[#111827] text-[#fdfaf4] shadow-lg"
              >
                <div className="border-b border-[#2f3b48] bg-black/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2e8cf]">
                  Overview video (placeholder)
                </div>
                <div className="flex items-center justify-center bg-black/50 px-4 py-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#f2e8cf] text-xs">
                    ▶
                  </div>
                </div>
                <div className="border-t border-[#2f3b48] px-4 py-3 text-[11px] text-[#e3dcc9]">
                  In your live site, this area will host a video explaining
                  pre-arrangements and how EverLead supports your family.
                </div>
              </div>

              <div className="rounded-xl border border-[#d4c6a8] bg-[#fdfaf4] p-4 text-xs text-slate-700 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                  A calm place to plan
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  We focus on clarity and care—not pressure.
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  You&apos;re welcome to use EverLead simply to gather your
                  thoughts. Connecting with a professional is always your
                  choice, and always at your pace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / reassurance */}
      <section
        id="about"
        className="border-b border-[#e0d5bf] bg-[#f5f2ec] py-10 md:py-14"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
            <div>
              <h2
                className="text-xl font-semibold text-slate-900 md:text-2xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Planning ahead can be an act of love.
              </h2>
              <p className="mt-3 text-sm text-slate-700 md:text-[15px]">
                Many families tell us they simply don&apos;t know where to
                start. There are questions about cost, what&apos;s customary
                or appropriate, and how to balance different wishes within a
                family.
              </p>
              <p className="mt-2 text-sm text-slate-700 md:text-[15px]">
                EverLead offers a quiet space to think through these decisions
                in advance. We help you organise the details so that, when the
                time comes, your family can focus more on each other and less
                on paperwork.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#e0d5bf] bg-[#fbf7ee] p-4 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                At a glance
              </p>
              <ul className="space-y-1">
                <li>• No obligation or payment required to begin planning.</li>
                <li>• Your answers are stored securely and can be updated.</li>
                <li>
                  • When you&apos;re ready, we connect you with a vetted
                  pre-planning specialist.
                </li>
                <li>• Designed to complement, not replace, your funeral home.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Planning options */}
      <section
        id="services"
        className="border-b border-[#e0d5bf] bg-[#fbf7ee] py-10 md:py-14"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            className="mb-4 text-xl font-semibold text-slate-900 md:text-2xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            What you can plan with EverLead
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#e3d5b7] bg-white p-5 text-xs text-slate-700 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                Service preferences
              </p>
              <p className="text-sm font-medium text-slate-900">
                Type of service &amp; setting
              </p>
              <p className="mt-1">
                Visitation, ceremony, reception, music, readings, and other
                personal touches that matter to you.
              </p>
            </div>
            <div className="rounded-xl border border-[#e3d5b7] bg-white p-5 text-xs text-slate-700 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                Burial or cremation
              </p>
              <p className="text-sm font-medium text-slate-900">
                Final resting place
              </p>
              <p className="mt-1">
                Choices around burial, cremation, columbarium, or scattering,
                including any special wishes.
              </p>
            </div>
            <div className="rounded-xl border border-[#e3d5b7] bg-white p-5 text-xs text-slate-700 shadow-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                Practical details
              </p>
              <p className="text-sm font-medium text-slate-900">
                Contacts &amp; important information
              </p>
              <p className="mt-1">
                Key contacts, preferences for clergy or celebrants, and other
                details your family will need.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/get-started"
              className="inline-flex items-center rounded-full border border-[#c9b892] bg-[#1f2933] px-5 py-2 text-xs font-semibold text-[#fdfaf4] shadow-sm hover:bg-black"
            >
              Begin the confidential questionnaire
            </Link>
          </div>
        </div>
      </section>

      {/* Resources / flyers / FAQ */}
      <section
        id="resources"
        className="bg-[#f5f2ec] py-10 md:py-14"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-[1.3fr,1fr]">
            {/* Resource cards */}
            <div>
              <h2
                className="mb-3 text-xl font-semibold text-slate-900 md:text-2xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Helpful guides for you and your family
              </h2>
              <div className="space-y-3 text-xs text-slate-700">
                <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                    Printable flyer (PDF)
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    "Starting the conversation about funeral wishes."
                  </p>
                  <p className="mt-1">
                    A one-page sheet you can print and share with family
                    members when you&apos;re ready to talk.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                    Planning checklist
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    All the key decisions in one place.
                  </p>
                  <p className="mt-1">
                    A checklist that mirrors the EverLead questionnaire so you
                    can review or complete it offline.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a744c]">
                    Questions for your funeral home
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    Feel confident walking into any meeting.
                  </p>
                  <p className="mt-1">
                    A simple list of questions to help you understand your
                    options and feel comfortable with your choices.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3 text-xs text-slate-700">
              <h2
                className="text-xl font-semibold text-slate-900 md:text-2xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Common questions
              </h2>

              <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Do I have to choose a funeral home now?
                </p>
                <p className="mt-1">
                  No. EverLead helps you think through your wishes first. When
                  you&apos;re ready, we can connect you with a carefully
                  selected local professional.
                </p>
              </div>

              <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Will my information be shared widely?
                </p>
                <p className="mt-1">
                  Never. Your details are kept confidential. If you ask to be
                  contacted, we only share your information with selected
                  professionals, not a public list.
                </p>
              </div>

              <div className="rounded-xl border border-[#e3d5b7] bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  What if I change my mind later?
                </p>
                <p className="mt-1">
                  Plans can be updated. Many people revisit their wishes as
                  life changes; EverLead is designed to support that.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e0d5bf] bg-[#1f2933] text-[#e0d5bf]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-[11px] md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} EverLead. Tools to support thoughtful
            pre-arrangement.
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <span className="text-[#c7b89a]">
              EverLead is not a funeral home and does not provide legal or
              financial advice.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
