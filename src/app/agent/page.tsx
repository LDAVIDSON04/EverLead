// src/app/agent/page.tsx
"use client";

import Link from "next/link";

export default function AgentLandingPage() {
  const scrollToHowItWorks = () => {
    const element = document.getElementById("how-it-works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a]">
      {/* Header */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex flex-col">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#2a2a2a]">
              Soradin
            </Link>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b] mt-0.5">
              For funeral professionals
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
      <section className="border-b border-[#ded3c2] bg-white/80 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1
            className="mb-4 text-4xl font-normal leading-tight text-[#2a2a2a] md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Soradin for funeral professionals
          </h1>
          <p className="mb-8 mx-auto max-w-2xl text-lg leading-relaxed text-[#4a4a4a]">
            Receive high-intent pre-need inquiries in your area, ready for thoughtful follow-up.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/agent/dashboard"
              className="w-full rounded-full bg-[#2a2a2a] px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#3a3a3a] transition-colors sm:w-auto"
            >
              Open agent dashboard
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-base text-slate-700 shadow-sm hover:bg-slate-50 transition-colors sm:w-auto"
            >
              Learn how Soradin works
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-6 py-16 md:py-20"
      >
        <div className="mb-12 text-center">
          <h2
            className="mb-3 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            How it works
          </h2>
          <p className="text-sm text-[#6b6b6b]">
            A simple process to connect with families who are ready to plan.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-semibold text-white">
              1
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Families plan online
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Soradin guides families through a gentle questionnaire about their wishes.
            </p>
          </div>

          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-semibold text-white">
              2
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Qualified leads appear in your portal
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Agents see location, urgency, and service preferences in one place.
            </p>
          </div>

          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-semibold text-white">
              3
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Buy now or bid
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Agents can purchase leads securely through the dashboard.
            </p>
          </div>

          <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] text-sm font-semibold text-white">
              4
            </div>
            <h3
              className="mb-2 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Track ROI over time
            </h3>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              The dashboard shows leads purchased and revenue.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-[#ded3c2] bg-[#f7f4ef] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-12 text-center text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Benefits
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-[#ded3c2] bg-white p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                High-intent inquiries
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Families who have completed our planning questionnaire and expressed interest in pre-arrangement services.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-white p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Local radius targeting
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Filter leads by location to focus on families in your service area.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-white p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Predictable cost per lead
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Transparent pricing with buy-now options and bidding for competitive leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[#ded3c2] bg-white py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2
            className="mb-4 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Already an approved agent?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[#4a4a4a]">
            Access your dashboard to view available leads, manage your pipeline, and track your results.
          </p>
          <Link
            href="/agent/dashboard"
            className="inline-block rounded-full bg-[#2a2a2a] px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#3a3a3a] transition-colors"
          >
            Go to agent dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-xs text-[#6b6b6b] md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Soradin. Tools for funeral professionals.
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
