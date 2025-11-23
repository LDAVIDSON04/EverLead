"use client";

import Link from "next/link";
import { useState } from "react";
import IntroVideoModal from "@/components/IntroVideoModal";

export default function HomePage() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#faf8f5] via-[#f7f4ef] to-[#f5f1eb] text-[#2a2a2a]">
      {/* Header */}
      <header className="bg-[#1f2933]/95 backdrop-blur-sm text-white border-b border-[#1f2933]/20 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          {/* Left: Logo */}
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-light tracking-wide text-white">
              Soradin
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#e0d5bf]/80 font-light">
              PRE-PLANNING
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            <Link
              href="/get-started"
              className="rounded-full border border-[#e5d7b5]/40 bg-white/5 backdrop-blur-sm px-5 py-2 text-xs font-light tracking-wide text-[#e0d5bf] hover:bg-white/10 hover:border-[#e5d7b5]/60 transition-all duration-300"
            >
              Get started
            </Link>
            <Link
              href="/agent"
              className="text-xs text-[#e0d5bf]/80 hover:text-white transition-colors font-light tracking-wide"
            >
              For professionals
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f7f4ef] to-[#f5f1eb]"></div>
        <div className="relative w-full">
          {/* Hero Image - Full Width */}
          <div className="relative w-full h-[380px] md:h-[480px] lg:h-[520px] overflow-hidden bg-[#e5ddd0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none"></div>
          </div>
          
          {/* Content Below Image */}
          <div className="relative mx-auto max-w-5xl px-6 py-16 md:py-20">
            <div className="flex flex-col gap-8 text-center">
              <div className="space-y-6">
                <h1
                  className="text-5xl font-light text-[#1a1a1a] leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  A gentle way to plan ahead
                  <br />
                  <span className="text-[#4a4a4a]">with care, clarity, and confidence.</span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#5a5a5a] sm:text-xl md:text-xl font-light">
                  Planning ahead doesn&apos;t have to feel overwhelming. Soradin guides you through simple, thoughtful conversations about your wishes, helping you make decisions now so the people you love are supported later.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
                <Link
                  href="/get-started"
                  className="group w-full rounded-full bg-[#1a1a1a] px-8 py-4 text-base font-light tracking-wide text-white shadow-lg shadow-black/5 hover:bg-[#2a2a2a] hover:shadow-xl hover:shadow-black/10 transition-all duration-300 sm:w-auto"
                >
                  Start planning online
                </Link>
                <a
                  href="#intro-video"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowVideoModal(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-[#d4c9b8] bg-white/60 backdrop-blur-sm px-6 py-4 text-base text-[#2a2a2a] shadow-sm hover:bg-white/80 hover:border-[#c4b9a8] transition-all duration-300 sm:w-auto font-light"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f4ef] text-xs text-[#6b6b6b]">
                    ▶
                  </span>
                  Watch Introduction Video
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Plan - Cards Section */}
      <section
        id="planning-options"
        className="relative py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16 space-y-4">
            <h2
              className="text-4xl font-light text-[#1a1a1a] sm:text-5xl md:text-5xl tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Everything you need to document
              <br />
              <span className="text-[#4a4a4a]">all in one place.</span>
            </h2>
            <p className="text-base text-[#6b6b6b] font-light max-w-2xl mx-auto">
              Soradin helps you organize every major part of your pre-planning
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Cremation or burial choices */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Cremation or burial choices
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Understand your options with clear explanations.
              </p>
            </div>

            {/* Service preferences */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service preferences
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Decide what kind of gathering feels right for you.
              </p>
            </div>

            {/* Personal wishes */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Personal wishes
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                From music to readings to final requests — capture it all.
              </p>
            </div>

            {/* Practical details */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Practical details
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Documents, contacts, and everything your family needs in the future.
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-[#7a7a7a] mt-12 font-light tracking-wide">
            Your decisions are saved safely and shared only when you choose.
          </p>
        </div>
      </section>

      {/* How Soradin Works Section */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16 space-y-4">
            <h2
              className="text-4xl font-light text-[#1a1a1a] sm:text-5xl md:text-5xl tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Simple, supportive, and designed
              <br />
              <span className="text-[#4a4a4a]">for peace of mind.</span>
            </h2>
            <p className="text-sm text-[#7a7a7a] font-light tracking-[0.2em] uppercase">
              How Soradin works
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center space-y-4">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-[#e5ddd0]/40 text-xl font-light text-[#1a1a1a] shadow-sm">
                1
              </div>
              <h3
                className="text-lg font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Start with a guided questionnaire
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Our step-by-step experience helps you think through your choices at your own pace.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-[#e5ddd0]/40 text-xl font-light text-[#1a1a1a] shadow-sm">
                2
              </div>
              <h3
                className="text-lg font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Review your personalized plan
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We summarize your wishes clearly — no paperwork, no pressure.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-[#e5ddd0]/40 text-xl font-light text-[#1a1a1a] shadow-sm">
                3
              </div>
              <h3
                className="text-lg font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Connect with trusted specialists
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                If you&apos;re ready, we can help match you with professional support in your area.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-[#e5ddd0]/40 text-xl font-light text-[#1a1a1a] shadow-sm">
                4
              </div>
              <h3
                className="text-lg font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Access your plan any time
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Update or add details whenever life changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Choose Soradin */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16 space-y-6">
            <h2
              className="text-4xl font-light text-[#1a1a1a] md:text-5xl tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Clarity when it matters most.
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#5a5a5a] font-light">
              Pre-planning isn&apos;t about preparing for loss — it&apos;s about protecting the people you love. Soradin makes the process simple, thoughtful, and emotionally grounded.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Reduce stress for your family later
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Your choices are recorded clearly so no one has to guess.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Avoid unexpected costs
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Understanding your options early helps you make informed decisions.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Keep everything organized
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                All your wishes stored in one private, secure place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-light text-[#1a1a1a] sm:text-5xl tracking-tight mb-4"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              What families are saying
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <span className="text-5xl text-[#e5ddd0] font-light leading-none block mb-4">&ldquo;</span>
              <p className="mb-6 italic leading-relaxed text-[#5a5a5a] font-light text-[15px]">
                Soradin helped me put everything in writing in less than half an hour. I finally feel prepared — and my kids are relieved too.
              </p>
              <p
                className="text-sm font-light text-[#1a1a1a] tracking-wide"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                – Margaret R.
              </p>
            </div>
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <span className="text-5xl text-[#e5ddd0] font-light leading-none block mb-4">&ldquo;</span>
              <p className="mb-6 italic leading-relaxed text-[#5a5a5a] font-light text-[15px]">
                The process was gentle and thoughtful. It made something difficult feel manageable.
              </p>
              <p
                className="text-sm font-light text-[#1a1a1a] tracking-wide"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                – Daniel S.
              </p>
            </div>
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <span className="text-5xl text-[#e5ddd0] font-light leading-none block mb-4">&ldquo;</span>
              <p className="mb-6 italic leading-relaxed text-[#5a5a5a] font-light text-[15px]">
                I didn&apos;t know where to start. Soradin made the steps clear and simple.
              </p>
              <p
                className="text-sm font-light text-[#1a1a1a] tracking-wide"
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
        className="relative py-24 md:py-32"
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-light text-[#1a1a1a] md:text-5xl tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Common questions
            </h2>
          </div>
          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Do I need to know all my decisions now?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                No — you can complete what you&apos;re certain about and return anytime to add details.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Is my information secure?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Yes. Soradin uses encrypted storage and never shares your details without your permission.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Does this commit me to anything?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Not at all. Completing your plan is free and comes with no obligation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 md:py-40">
        <div className="mx-auto max-w-3xl px-6 text-center space-y-8">
          <h2
            className="text-4xl font-light text-[#1a1a1a] md:text-5xl tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Start planning with Soradin today
          </h2>
          <p className="text-lg leading-relaxed text-[#5a5a5a] font-light max-w-xl mx-auto">
            A few guided questions now can make a world of difference later.
          </p>
          <Link
            href="/get-started"
            className="inline-block rounded-full bg-[#1a1a1a] px-10 py-4 text-base font-light tracking-wide text-white shadow-lg shadow-black/5 hover:bg-[#2a2a2a] hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
          >
            Begin your plan
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#e5ddd0]/30 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-8 text-center text-xs text-[#7a7a7a] md:flex-row md:justify-between md:text-left font-light tracking-wide">
          <div>
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#" className="hover:text-[#1a1a1a] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#1a1a1a] transition-colors">
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
