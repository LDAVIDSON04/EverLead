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
                  Planning ahead doesn&apos;t have to feel overwhelming. Soradin will help to guide you through the various options available to you for your legacy planning. Connecting you to experts in your area with the local knowledge you desire, the compassion you need and the experience to make the entire process a little bit easier. By taking the time now to make your arrangements, we ensure the people you love are supported later.
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
              Practical. Efficient. Simplified.
            </h2>
            <p className="text-base text-[#6b6b6b] font-light max-w-2xl mx-auto">
              Soradin helps you by collecting some important information and linking you with our network of experts.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Burial or Cremation options */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Burial or Cremation options
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Understanding your options with clear explanations and local knowledge.
              </p>
            </div>

            {/* Service Preferences */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service Preferences
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Decide on what kind of service, gathering, memorial or lack of formal service suits you best.
              </p>
            </div>

            {/* Personal Wishes */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-3 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Personal Wishes
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                From no service to a full traditional, the logistics matter and preplanning helps to remove uncertainty.
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
                Our step-by-step helps guide you through the common questions to begin to outline your wishes.
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
                We summarize your wishes clearly and send them to you for your planning file.
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
                Connect with a trusted specialist
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We match you with a trusted prearrangement specialist in your area to help you finalize your plan and answer any further questions.
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
                Access and Download your plan anytime
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Update or add details whenever life changes with your planning profile.
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
              Making taking the next step more supportive for your peace of mind
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Remove financial burdens
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Preplanning helps to remove the financial burden from your loved ones at a time when making financial decisions can be difficult.
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
                Understanding your options helps you make informed decisions.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Having time to breath
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Being prepared ahead of time allows your family to step back, take a breath and move through the process with clarity.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Fulfilling your duty
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Taking responsibility for your estate plan and ensuring your loved ones are not left in a tough situation.
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
                All your wishes stored in a private and secure place.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3
                className="mb-4 text-xl font-light text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Remove uncertainty
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Your choices are recorded clearly and your plan helps to ensure your family and loved ones understand your wishes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Removed per document note: "What families are saying... remove this for now until we have reviews, then it should go on the bottom" */}

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
              FAQ Common Questions
            </h2>
          </div>
          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                I have filled out the form, what happens next?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                A prearrangement agent in your area will follow up with you to help you understand the various options to you and further discuss your plan.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Do I need to make a decision now?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                No, Soradin connects you with an agent in your area so you can begin the process of Funeral Planning, there is no obligation to finalize your plan now and you can move at your own pace.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Can I download my profile?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Yes, you can download your profile and add it the print out to your Estate Planning paperwork.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Is my information secure?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Yes, Soradin uses encrypted storage and only shares your information with our network of vetted prearrangement specialists.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="group rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#d4c9b8] transition-all duration-500">
              <h3 className="mb-3 text-lg font-light text-[#1a1a1a] tracking-tight">
                Does this commit me to anything?
              </h3>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                No, filling out the information form is free and comes with no obligation.
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
