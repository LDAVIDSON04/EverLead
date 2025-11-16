// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a]">
      {/* Header */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-[#2a2a2a]">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b] mt-0.5">
              Funeral pre-planning
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <a
              href="#"
              className="text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors"
            >
              Home
            </a>
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
            <Link
              href="/get-started"
              className="rounded-md bg-[#2a2a2a] px-5 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/agent"
              className="text-sm text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
            >
              Agent Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        {/* White Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/40" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h1
              className="mb-6 text-5xl font-normal leading-tight text-[#2a2a2a] md:text-6xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              A gentle way to plan ahead, with care and clarity.
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-[#4a4a4a] md:text-xl">
              EverLead guides you through thoughtful pre-planning conversations,
              helping you record your wishes and connect with trusted specialists
              when you&apos;re ready—so your family can focus on what matters most.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className="rounded-md bg-[#2a2a2a] px-6 py-3 text-base font-medium text-white hover:bg-[#3a3a3a] transition-colors shadow-sm"
              >
                Begin the Questionnaire
              </Link>
              <a
                href="#video"
                className="text-base text-[#4a4a4a] hover:text-[#2a2a2a] transition-colors underline underline-offset-4"
              >
                Watch Introduction Video
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Plan - Three Column Section */}
      <section
        id="planning-options"
        className="border-b border-[#ded3c2] bg-white py-16 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-12 text-center text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            What You Can Plan
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Service Preferences */}
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <div className="mb-4 text-4xl text-[#6b6b6b]">✿</div>
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service Preferences
              </h3>
              <p className="text-[#4a4a4a] leading-relaxed">
                Record your preferences for visitation, ceremony style, music,
                readings, and other personal touches that reflect your values
                and traditions.
              </p>
            </div>

            {/* Burial or Cremation */}
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <div className="mb-4 text-4xl text-[#6b6b6b]">◊</div>
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Burial or Cremation
              </h3>
              <p className="text-[#4a4a4a] leading-relaxed">
                Document your choices regarding final resting place, whether
                that&apos;s burial, cremation, columbarium, or scattering, along
                with any special wishes or considerations.
              </p>
            </div>

            {/* Practical Details */}
            <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-8 shadow-sm">
              <div className="mb-4 text-4xl text-[#6b6b6b]">◈</div>
              <h3
                className="mb-3 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Practical Details
              </h3>
              <p className="text-[#4a4a4a] leading-relaxed">
                Organize important contacts, preferences for clergy or
                celebrants, and other essential information your family will
                need during a difficult time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Plan Ahead - Two Column Section */}
      <section className="border-b border-[#ded3c2] bg-[#f7f4ef] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-[1.2fr,1fr]">
            {/* Left Side - Text */}
            <div>
              <h2
                className="mb-6 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Why Plan Ahead
              </h2>
              <p className="mb-4 text-lg leading-relaxed text-[#4a4a4a]">
                Planning ahead is an act of love. When you take the time to
                record your wishes in advance, you give your family the gift of
                clarity during one of life&apos;s most difficult moments.
              </p>
              <p className="text-lg leading-relaxed text-[#4a4a4a]">
                EverLead provides a calm, organized space to think through
                these important decisions at your own pace. We help you gather
                your thoughts, document your preferences, and connect with
                trusted professionals when you&apos;re ready—not before.
              </p>
            </div>

            {/* Right Side - At a Glance Box */}
            <div className="rounded-lg border border-[#ded3c2] bg-white p-8 shadow-sm">
              <h3
                className="mb-4 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                At a Glance
              </h3>
              <ul className="space-y-3 text-[#4a4a4a]">
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

      {/* Resources Section - Two Column */}
      <section
        id="resources"
        className="border-b border-[#ded3c2] bg-white py-16 md:py-20"
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
                  <p className="text-[#4a4a4a] leading-relaxed">
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
                  <p className="text-[#4a4a4a] leading-relaxed">
                    A comprehensive checklist that mirrors the EverLead
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
                <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-medium text-[#2a2a2a]">
                    Do I have to choose a funeral home now?
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">
                    No. EverLead helps you think through your wishes first.
                    When you&apos;re ready, we can connect you with a carefully
                    selected local professional.
                  </p>
                </div>

                {/* FAQ 2 */}
                <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-medium text-[#2a2a2a]">
                    Will my information be shared widely?
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">
                    Never. Your details are kept completely confidential. If you
                    choose to be contacted, we only share your information with
                    selected professionals, not a public list.
                  </p>
                </div>

                {/* FAQ 3 */}
                <div className="rounded-lg border border-[#ded3c2] bg-[#faf8f5] p-6 shadow-sm">
                  <h3 className="mb-2 text-base font-medium text-[#2a2a2a]">
                    What if I change my mind later?
                  </h3>
                  <p className="text-[#4a4a4a] leading-relaxed">
                    Plans can be updated at any time. Many people revisit their
                    wishes as life changes; EverLead is designed to support that
                    flexibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-[#f7f4ef] py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-xs text-[#6b6b6b] md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} EverLead. Gentle tools for thoughtful
            pre-planning.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-[#2a2a2a] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2a2a2a] transition-colors">
              Terms
            </Link>
            <span className="text-[#9b9b9b]">
              EverLead is not a funeral home and does not provide legal or
              financial advice.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
