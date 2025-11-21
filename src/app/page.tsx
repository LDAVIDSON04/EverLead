"use client";

import Link from "next/link";
import { useState } from "react";
import IntroVideoModal from "@/components/IntroVideoModal";

export default function HomePage() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a]">
      {/* Header */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          {/* Left: Logo */}
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">
              Soradin
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b] mt-0.5">
              Funeral pre-planning
            </span>
          </div>

          {/* Center: Nav items */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors"
            >
              Home
            </Link>
            <a
              href="#planning-options"
              className="text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors"
            >
              Planning Options
            </a>
            <a
              href="#resources"
              className="text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors"
            >
              Resources
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/get-started"
              className="rounded-md bg-[#2a2a2a] px-5 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-slate-200/50 bg-[radial-gradient(circle_at_top,_#fdf6ee_0%,_#f5f1eb_40%,_#f7f4ef_100%)] hero-soft-pattern shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-24 text-center md:py-28">
          <h1
            className="text-4xl font-semibold text-slate-900 leading-tight tracking-tight sm:text-5xl md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            A gentle way to plan ahead —<br />
            with care, clarity, and confidence.
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg md:text-lg">
            Planning ahead doesn&apos;t have to feel overwhelming. Soradin guides you through simple, thoughtful conversations about your wishes, helping you make decisions now so the people you love are supported later.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="w-full rounded-full bg-[#2a2a2a] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#3a3a3a] transition-colors sm:w-auto"
            >
              Start planning online
            </Link>
            <a
              href="#intro-video"
              onClick={(e) => {
                e.preventDefault();
                setShowVideoModal(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-base text-slate-700 shadow-sm hover:bg-slate-50 transition-colors sm:w-auto"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                ▶
              </span>
              Watch Introduction Video
            </a>
          </div>
        </div>
      </section>

      {/* What You Can Plan - Cards Section */}
      <section
        id="planning-options"
        className="border-b border-slate-100 bg-[#faf7f3]"
      >
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h2
            className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl mb-2"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Everything you need to document — all in one place.
          </h2>
          <p className="text-center text-sm text-slate-600 mb-10">
            Soradin helps you organize every major part of your pre-planning:
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cremation or burial choices */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Cremation or burial choices
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Understand your options with clear explanations.
              </p>
            </div>

            {/* Service preferences */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service preferences
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Decide what kind of gathering feels right for you.
              </p>
            </div>

            {/* Personal wishes */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Personal wishes
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                From music to readings to final requests — capture it all.
              </p>
            </div>

            {/* Practical details */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Practical details
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Documents, contacts, and everything your family needs in the future.
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-600 mt-8">
            Your decisions are saved safely and shared only when you choose.
          </p>
        </div>
      </section>

      {/* How Soradin Works Section */}
      <section className="border-b border-slate-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2
            className="mb-3 text-center text-2xl font-semibold text-slate-900 sm:text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Simple, supportive, and designed for peace of mind.
          </h2>
          <p className="mb-12 text-center text-sm text-slate-600">
            How Soradin works
          </p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ef] text-lg font-semibold text-[#2a2a2a]">
                1
              </div>
              <h3
                className="mb-3 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Start with a guided questionnaire
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Our step-by-step experience helps you think through your choices at your own pace.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ef] text-lg font-semibold text-[#2a2a2a]">
                2
              </div>
              <h3
                className="mb-3 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Review your personalized plan
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                We summarize your wishes clearly — no paperwork, no pressure.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ef] text-lg font-semibold text-[#2a2a2a]">
                3
              </div>
              <h3
                className="mb-3 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Connect with trusted specialists (optional)
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                If you&apos;re ready, we can help match you with professional support in your area.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ef] text-lg font-semibold text-[#2a2a2a]">
                4
              </div>
              <h3
                className="mb-3 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Access your plan any time
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Update or add details whenever life changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Choose Soradin */}
      <section className="border-b border-[#ded3c2] bg-[radial-gradient(circle_at_top,_#fdf6ee_0%,_#f5f1eb_40%,_#f7f4ef_100%)] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-4 text-center text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Clarity when it matters most.
          </h2>
          <p className="mb-12 mx-auto max-w-2xl text-center text-base leading-relaxed text-[#4a4a4a] md:text-lg">
            Pre-planning isn&apos;t about preparing for loss — it&apos;s about protecting the people you love. Soradin makes the process simple, thoughtful, and emotionally grounded.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Reduce stress for your family later
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Your choices are recorded clearly so no one has to guess.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Avoid unexpected costs
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Understanding your options early helps you make informed decisions.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Keep everything organized
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                All your wishes stored in one private, secure place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-slate-100 bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2
            className="mb-12 text-center text-2xl font-semibold text-slate-900 sm:text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            What families are saying
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                Soradin helped me put everything in writing in less than half an hour. I finally feel prepared — and my kids are relieved too.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                – Margaret R.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                The process was gentle and thoughtful. It made something difficult feel manageable.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                – Daniel S.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                I didn&apos;t know where to start. Soradin made the steps clear and simple.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                – Alyssa P.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="resources"
        className="border-b border-[#ded3c2] bg-white py-14 md:py-20"
      >
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className="mb-12 text-center text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Common questions
          </h2>
          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-slate-900">
                Do I need to know all my decisions now?
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                No — you can complete what you&apos;re certain about and return anytime to add details.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-slate-900">
                Is my information secure?
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Yes. Soradin uses encrypted storage and never shares your details without your permission.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-base font-semibold text-slate-900">
                Does this commit me to anything?
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Not at all. Completing your plan is free and comes with no obligation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-b border-[#ded3c2] bg-[radial-gradient(circle_at_top,_#fdf6ee_0%,_#f5f1eb_40%,_#f7f4ef_100%)] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2
            className="mb-4 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Start planning with Soradin today
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[#4a4a4a] md:text-lg">
            A few guided questions now can make a world of difference later.
          </p>
          <Link
            href="/get-started"
            className="inline-block rounded-full bg-[#2a2a2a] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#3a3a3a] transition-colors"
          >
            Begin your plan
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-[#f7f4ef] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-xs text-[#6b6b6b] md:flex-row md:justify-between md:text-left">
          <div>
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="#" className="hover:text-[#2a2a2a] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#2a2a2a] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <IntroVideoModal
        open={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </main>
  );
}
