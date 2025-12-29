"use client";

import Link from "next/link";
import Image from "next/image";

export default function WhatIsPreNeedFuneralPlanningPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-[#FAF9F6] py-5 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Soradin.png"
              alt="Soradin Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
            />
            <span className="text-2xl font-semibold text-[#1A1A1A]">Soradin</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/what-is-pre-need-funeral-planning" className="text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors">
              What is pre-need funeral planning?
            </Link>
            <Link href="/learn-more-about-starting" className="text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors">
              List your Specialty
            </Link>
            <Link href="/agent" className="bg-[#0C6F3C] text-white px-6 py-2.5 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm">
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-semibold text-[#1A1A1A] mb-6 leading-tight">
            What Is Pre-Need Funeral Planning?
          </h1>
          <p className="text-2xl text-[#1A1A1A]/80 leading-relaxed">
            A thoughtful way to plan ahead — on your own terms.
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-16">
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Pre-need funeral planning is the process of making decisions about your funeral and end-of-life arrangements in advance, while you are able to think clearly, ask questions, and make choices that reflect your values.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Rather than leaving these decisions to loved ones during an emotionally difficult time, pre-need planning allows you to document your wishes, understand your options, and ensure everything is handled the way you intend.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed font-medium">
            This is not about being morbid.<br />
            It&apos;s about clarity, peace of mind, and care for the people you love.
          </p>
        </section>

        {/* Why People Choose Pre-Need Planning */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            Why People Choose Pre-Need Planning
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-8">
            Most families are forced to make funeral decisions under stress and time pressure. Pre-need planning removes that burden.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            People choose to plan ahead because it allows them to:
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Make informed decisions without urgency</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Reduce emotional and financial stress on family members</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Clearly communicate personal, cultural, or religious preferences</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Avoid uncertainty, disagreements, or guesswork later</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Ensure arrangements align with their values and beliefs</span>
            </li>
          </ul>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed">
            Pre-need planning is a way of taking responsibility — not only for yourself, but for those who will one day be asked to carry these decisions forward.
          </p>
        </section>

        {/* What Is Covered */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            What Is Covered in Pre-Need Funeral Planning?
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-8">
            Pre-need planning is not a single decision. It&apos;s a guided conversation that typically covers several areas, including:
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Personal Preferences</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Burial or cremation</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Type of service or memorial</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Religious, cultural, or spiritual elements</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Music, readings, or personal touches</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Location and setting preferences</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Practical Arrangements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Funeral home selection</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Type of service (private, public, memorial, celebration of life)</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Transportation considerations</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Documentation and next steps</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Financial Considerations</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Understanding available options</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Discussing payment structures (without pressure)</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#0C6F3C] mt-1">•</span>
                  <span className="text-lg text-[#1A1A1A]/70">Planning in a way that aligns with your family&apos;s situation</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mt-8">
            A qualified pre-need specialist helps explain these choices clearly, without rushing or pushing decisions.
          </p>
        </section>

        {/* What Pre-Need Planning Is Not */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            What Pre-Need Planning Is Not
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Pre-need planning is often misunderstood. It is not:
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">A sales pitch</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">A forced purchase</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">A one-size-fits-all package</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">A commitment you can&apos;t change</span>
            </li>
          </ul>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed">
            A proper pre-need consultation is informational, supportive, and flexible. Plans can be revised over time as circumstances change.
          </p>
        </section>

        {/* Who Is Pre-Need Planning For */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            Who Is Pre-Need Planning For?
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Pre-need planning is not limited to a specific age group.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            People who often find it valuable include:
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Individuals planning for the future</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Couples who want clarity for each other</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Parents who want to ease the burden on their children</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">People with specific cultural, religious, or personal wishes</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Anyone who values preparation and thoughtful decision-making</span>
            </li>
          </ul>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed font-medium">
            There is no &quot;right time&quot; — only the time that feels right for you.
          </p>
        </section>

        {/* What Happens During a Consultation */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            What Happens During a Pre-Need Consultation?
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6 font-medium">
            A pre-need consultation is a conversation, not a transaction.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            During a consultation, you can expect to:
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Ask questions freely</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Learn about your options in plain language</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Discuss your priorities and concerns</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Receive guidance from a verified professional</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Decide what — if anything — you&apos;d like to document or plan next</span>
            </li>
          </ul>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed">
            There is no obligation to move forward. The goal is understanding, not pressure.
          </p>
        </section>

        {/* How Soradin Helps */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            How Soradin Helps
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Soradin connects individuals and families with verified pre-need funeral planning specialists who meet professional and credentialing standards.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Through Soradin, you can:
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">View specialist profiles and backgrounds</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Understand their areas of expertise</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Request an in-person consultation</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#0C6F3C] text-xl mt-1">•</span>
              <span className="text-lg text-[#1A1A1A]/70">Feel confident you&apos;re speaking with a qualified professional</span>
            </li>
          </ul>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed">
            Every specialist on Soradin is reviewed before being listed, so you can focus on the conversation — not on vetting credentials.
          </p>
        </section>

        {/* Closing */}
        <section className="mb-16">
          <h2 className="text-4xl font-semibold text-[#1A1A1A] mb-6">
            A Thoughtful Step Forward
          </h2>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed mb-6">
            Planning ahead doesn&apos;t mean dwelling on the end.<br />
            It means making space for clarity, dignity, and peace of mind.
          </p>
          <p className="text-lg text-[#1A1A1A]/70 leading-relaxed">
            Pre-need funeral planning gives you control over important decisions — and gives your loved ones the comfort of knowing your wishes were thoughtfully considered.
          </p>
        </section>

        {/* CTA */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#1A1A1A] mb-4">
              Ready to learn more?
            </h3>
            <p className="text-lg text-[#1A1A1A]/70 mb-8">
              Find a verified pre-need planning specialist in your area
            </p>
            <Link 
              href="/search"
              className="inline-block bg-[#0C6F3C] text-white px-8 py-4 rounded-xl hover:bg-[#0C6F3C]/90 transition-all text-lg shadow-sm"
            >
              Find a specialist
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
