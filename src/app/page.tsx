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
            <Link
              href="/agent"
              className="text-sm text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
            >
              For professionals
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-slate-200/50 bg-[radial-gradient(circle_at_top,_#fdf6ee_0%,_#f5f1eb_40%,_#f7f4ef_100%)] hero-soft-pattern shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-24 text-center md:py-28">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
            FUNERAL PRE-PLANNING
          </p>
          <h1
            className="text-4xl font-semibold text-slate-900 leading-tight tracking-tight sm:text-5xl md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            A gentle way to plan ahead, with care and clarity.
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-base">
            Soradin guides you through thoughtful pre-planning conversations,
            helping you record your wishes and connect with trusted specialists
            when you&apos;re ready—so your family can focus on what matters most.
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
              Watch introduction video
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
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Planning Overview
          </p>
          <h2
            className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            What you can plan with Soradin
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Thoughtfully document your wishes across all aspects of pre-planning
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Service Preferences */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service Preferences
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Record your preferences for visitation, ceremony style, music,
                readings, and other personal touches that reflect your values
                and traditions.
              </p>
            </div>

            {/* People Involved */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                People Involved
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Document who should be involved in planning, who to notify, and
                any special roles or responsibilities for family members or
                close friends.
              </p>
            </div>

            {/* Budget & Payment Options */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Budget &amp; Payment Options
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Consider your budget preferences and explore payment options,
                including pre-payment plans, insurance, or other arrangements
                that work for your situation.
              </p>
            </div>

            {/* Documents / Wishes Recorded */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3
                className="mb-2 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Documents &amp; Wishes Recorded
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Keep all your important documents, special wishes, and personal
                notes organized in one secure place that your family can access
                when needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Plan Ahead - Two Column Section */}
      <section className="border-t border-[#ded3c2] border-b border-[#ded3c2] bg-[#f7f4ef] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-[1.3fr,1fr]">
            {/* Left Side - Text */}
            <div>
              <h2
                className="mb-6 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Why Plan Ahead
              </h2>
              <p className="mb-4 text-base leading-relaxed text-[#4a4a4a] md:text-lg">
                Planning ahead is an act of love. When you take the time to
                record your wishes in advance, you give your family the gift of
                clarity during one of life&apos;s most difficult moments.
              </p>
              <p className="text-base leading-relaxed text-[#4a4a4a] md:text-lg">
                Soradin provides a calm, organized space to think through
                these important decisions at your own pace. We help you gather
                your thoughts, document your preferences, and connect with
                trusted professionals when you&apos;re ready—not before.
              </p>
            </div>

            {/* Right Side - At a Glance Box */}
            <div className="rounded-lg border border-[#ded3c2] bg-white p-8 shadow-md">
              <h3
                className="mb-4 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                At a Glance
              </h3>
              <ul className="space-y-3 text-sm text-[#4a4a4a]">
                <li className="flex items-start">
                  <span className="mr-3 text-[#6b6b6b]">•</span>
                  <span>No obligation or payment required to begin planning</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-[#6b6b6b]">•</span>
                  <span>Your answers are stored securely and can be updated anytime</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-[#6b6b6b]">•</span>
                  <span>Connect with vetted pre-planning specialists when ready</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-[#6b6b6b]">•</span>
                  <span>Designed to complement, not replace, your funeral home</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Families Trust Soradin */}
      <section className="border-b border-[#ded3c2] bg-[radial-gradient(circle_at_top,_#fdf6ee_0%,_#f5f1eb_40%,_#f7f4ef_100%)] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-12 text-center text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Why Families Trust Soradin
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm min-h-[200px]">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Gentle, no-pressure guidance
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                We understand this is a sensitive topic. Our approach is
                respectful, patient, and designed to help you think through
                decisions without any pressure or urgency.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm min-h-[200px]">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Independent of any single funeral home
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Soradin is not affiliated with any specific funeral home. We
                help you explore your options and connect with professionals
                who match your needs and values.
              </p>
            </div>

            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm min-h-[200px]">
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Built with pre-need professionals
              </h3>
              <p className="text-sm leading-relaxed text-[#4a4a4a]">
                Our platform and resources are developed in collaboration with
                experienced pre-arrangement specialists who understand the
                nuances of thoughtful planning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-slate-100 bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm min-h-[220px]">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                Soradin helped me feel organised and prepared. It gave me peace
                of mind knowing my wishes are documented.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                S. Peterson
              </p>
              <p className="text-xs text-slate-500">Penticton, BC</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm min-h-[220px]">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                It made a hard topic easier to talk about with my family. The
                gentle approach made all the difference.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                M. L.
              </p>
              <p className="text-xs text-slate-500">Vernon, BC</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm min-h-[220px]">
              <span className="text-4xl text-slate-300">&ldquo;</span>
              <p className="mt-2 italic leading-relaxed text-slate-700">
                As a pre-need counsellor, I appreciate how Soradin respects
                families&apos; pace and provides a thoughtful framework for
                planning.
              </p>
              <p
                className="mt-4 text-sm font-medium text-slate-900"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Licensed Pre-Need Counsellor
              </p>
              <p className="text-xs text-slate-500">Kelowna, BC</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section - Two Column */}
      <section
        id="resources"
        className="border-b border-[#ded3c2] bg-white py-14 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr]">
            {/* Left Side - Guides */}
            <div>
              <h2
                className="mb-6 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Guides &amp; Printable Resources
              </h2>
              <div className="space-y-4">
                {/* Printable Flyer */}
                <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Printable Flyer
                  </p>
                  <h3 className="mb-2 text-lg font-medium text-[#2a2a2a]">
                    Starting the Conversation About Funeral Wishes
                  </h3>
                  <p className="text-sm leading-relaxed text-[#4a4a4a]">
                    A one-page guide you can print and share with family members
                    when you&apos;re ready to discuss your wishes together.
                  </p>
                </div>

                {/* Planning Checklist */}
                <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Planning Checklist
                  </p>
                  <h3 className="mb-2 text-lg font-medium text-[#2a2a2a]">
                    All the Key Decisions in One Place
                  </h3>
                  <p className="text-sm leading-relaxed text-[#4a4a4a]">
                    A comprehensive checklist that mirrors the Soradin
                    questionnaire, so you can review or complete it offline at
                    your own pace.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - FAQ */}
            <div>
              <h2
                className="mb-6 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Common Questions
              </h2>
              <div className="space-y-4">
                {/* FAQ 1 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">
                    Is there any obligation to buy a plan?
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    No. Soradin helps you think through your wishes first.
                    When you&apos;re ready, we can connect you with a carefully
                    selected local professional. There is no obligation or
                    payment required to begin planning.
                  </p>
                </div>

                {/* FAQ 2 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">
                    How are my details shared with professionals?
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Your details are kept completely confidential. If you
                    choose to be contacted, we only share your information with
                    selected, vetted professionals who match your needs—never
                    with a public list or multiple providers.
                  </p>
                </div>

                {/* FAQ 3 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">
                    Do I pay Soradin or the funeral home?
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Soradin is free to use for planning. If you choose to
                    purchase a pre-arrangement plan, you work directly with the
                    funeral home or pre-need specialist. Soradin does not
                    charge families for our planning tools.
                  </p>
                </div>

                {/* FAQ 4 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">
                    What if I change my mind later?
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Plans can be updated at any time. Many people revisit their
                    wishes as life changes; Soradin is designed to support that
                    flexibility. Your answers are stored securely and can be
                    modified whenever you need.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-[#f7f4ef] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-xs text-[#6b6b6b] md:flex-row md:justify-between md:text-left">
          <div>
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/agent" className="hover:text-[#2a2a2a] transition-colors">
              For funeral professionals →
            </Link>
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
