// src/app/agent/page.tsx
import Link from "next/link";

export default function AgentLandingPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a]">
      {/* Header */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex flex-col">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#2a2a2a]">
              EverLead
            </Link>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b] mt-0.5">
              Agent Portal
            </span>
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/"
              className="text-xs text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
            >
              For families
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#2a2a2a] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#3a3a3a] transition-colors"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#ded3c2] bg-white/80 py-12 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-center">
          {/* Left side */}
          <div className="flex-1">
            <p className="mb-3 inline-flex rounded-full bg-[#f7f4ef] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6b6b]">
              For funeral sales professionals
            </p>

            <h1
              className="mb-4 text-3xl font-normal leading-tight text-[#2a2a2a] md:text-4xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Turn pre-need interest into a steady, predictable pipeline.
            </h1>

            <p className="mb-6 max-w-xl text-base leading-relaxed text-[#4a4a4a]">
              EverLead collects pre-need interest from families through a guided
              questionnaire, then delivers qualified leads directly to your agent
              dashboard. Buy now or bid on leads, track your results, and build a
              consistent pipeline of warm conversations.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3a3a3a] transition-colors"
              >
                Log in or create agent account
              </Link>
              <a
                href="#how-it-works-agents"
                className="text-sm text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors underline underline-offset-4"
              >
                How the marketplace works
              </a>
            </div>
          </div>

          {/* Right side - Summary card */}
          <div className="flex-1">
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                What you get
              </p>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm font-medium text-[#2a2a2a]">
                    Lead types
                  </p>
                  <p className="text-xs text-[#6b6b6b]">
                    Hot, warm &amp; cold
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-[#2a2a2a]">
                    First lead
                  </p>
                  <p className="text-xs text-[#6b6b6b]">
                    First lead free for every new agent
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-[#2a2a2a]">
                    Access
                  </p>
                  <p className="text-xs text-[#6b6b6b]">
                    Simple web dashboard to track your leads
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works for agents */}
      <section
        id="how-it-works-agents"
        className="mx-auto max-w-6xl px-6 py-12 md:py-16"
      >
        <div className="mb-8">
          <h2
            className="mb-3 text-2xl font-normal text-[#2a2a2a] md:text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            How EverLead works for agents
          </h2>
          <p className="text-sm text-[#6b6b6b]">
            A simple process to build your pre-need pipeline.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-[11px] font-semibold text-white">
              1
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Create your agent account
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Sign up with your work email, add your funeral home or territory,
              and claim your first free lead to get started.
            </p>
          </div>

          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-[11px] font-semibold text-white">
              2
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Browse &amp; buy leads
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Filter by urgency and location, then use Buy Now or bidding to
              secure exclusive leads in your area.
            </p>
          </div>

          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-[11px] font-semibold text-white">
              3
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Work the cases &amp; track results
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Contact families, document outcomes, and see how your investment
              in leads turns into closed pre-need plans.
            </p>
          </div>
        </div>
      </section>

      {/* What agents receive */}
      <section className="border-t border-[#ded3c2] bg-[#f7f4ef] py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-8 text-2xl font-normal text-[#2a2a2a] md:text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            What agents receive
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Qualified pre-need inquiries
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Families who have completed our planning questionnaire and
                expressed interest in pre-arrangement services.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Lead details with urgency levels
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Each lead is tagged HOT, WARM, or COLD based on timeline and
                intent, with full contact information and preferences.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Simple dashboard to track leads
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                A clean, organized dashboard where you can view available leads,
                manage your purchased leads, and add notes as you work cases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-xs text-[#6b6b6b] md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} EverLead. Tools for funeral professionals.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-[#2a2a2a] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2a2a2a] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
