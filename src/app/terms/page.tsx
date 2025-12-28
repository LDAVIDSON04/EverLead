import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Soradin",
  description: "Soradin Terms of Service - Last updated November 23, 2025",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#faf8f5] via-[#f7f4ef] to-[#f5f1eb] text-[#2a2a2a]">
      {/* Header */}
      <header className="bg-[#1f2933]/95 backdrop-blur-sm text-white border-b border-[#1f2933]/20 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="text-xl font-light tracking-wide text-white">
              Soradin
            </Link>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#e0d5bf]/80 font-light">
              PRE-PLANNING
            </span>
          </div>
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

      {/* Content */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors mb-8"
            >
              ← Back to home
            </Link>
            <h1
              className="text-4xl font-light text-[#1a1a1a] mb-4 tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Soradin Terms of Service
            </h1>
            <p className="text-sm text-[#6b6b6b] font-light">
              Last updated: November 23, 2025
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            {/* Section 1 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                1. Acceptance of Terms
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Welcome to Soradin (&quot;Soradin,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of our websites, applications, questionnaires, and related services (collectively, the &quot;Service&quot;).
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-4">
                By accessing or using the Service, creating an account, or submitting information through Soradin, you agree to be bound by these Terms. If you do not agree, you must not use the Service.
              </p>
            </div>

            {/* Section 2 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                2. What Soradin Is (and Is Not)
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin is a digital pre-planning platform. We:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                <li>provide a guided questionnaire to help you think about and record your funeral and pre-need preferences; and</li>
                <li>when requested, may connect you with third-party funeral pre-planning specialists or related professionals (&quot;Specialists&quot;).</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6 mb-4">
                Soradin is not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                <li>a funeral home, cemetery, insurance company, law firm, or financial advisor;</li>
                <li>a provider of funeral services, legal services, or financial products; or</li>
                <li>a party to any agreement you enter into with a Specialist or any third party.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6">
                Any information provided through the Service is for informational and planning purposes only and does not constitute legal, financial, tax, medical, or funeral advice. You are responsible for your own decisions and should consult qualified professionals as needed.
              </p>
            </div>

            {/* Section 3 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                3. Eligibility; Accounts
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You must be at least 18 years old to use the Service.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                By using Soradin, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>you are at least 18;</li>
                <li>you have the legal capacity to enter into these Terms; and</li>
                <li>your use of the Service complies with all applicable laws.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                To access some features, you may need to create an account and provide certain information (such as your name and email). You agree to provide accurate information and keep it up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We may suspend or terminate your account at any time if we believe you have violated these Terms or used the Service in an unlawful or harmful way.
              </p>
            </div>

            {/* Section 4 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                4. Your Use of the Service
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Subject to these Terms, Soradin grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You agree that you will not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                <li>use the Service for any unlawful purpose;</li>
                <li>attempt to reverse engineer, decompile, or otherwise access source code;</li>
                <li>scrape, crawl, or use automated tools to extract data without our consent;</li>
                <li>upload viruses, malware, or harmful code;</li>
                <li>use the Service to harass, threaten, or discriminate against any person or group;</li>
                <li>impersonate any person or misrepresent your identity; or</li>
                <li>use the Service to build a competing product or service.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6">
                We may modify, suspend, or discontinue any part of the Service at any time, with or without notice.
              </p>
            </div>

            {/* Section 5 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                5. Information You Provide
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                When you use Soradin, you may submit information such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>personal and contact details;</li>
                <li>your preferences, wishes, and notes about pre-need or funeral planning;</li>
                <li>information about your family or designated contacts.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You retain ownership of the content you provide, but by submitting it through the Service you grant Soradin a non-exclusive, worldwide, royalty-free license to use, store, process, and display that information as needed to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>operate and improve the Service;</li>
                <li>generate your pre-planning record;</li>
                <li>connect you with Specialists at your request; and</li>
                <li>comply with legal obligations.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You represent and warrant that you have the right to provide all information you submit and that it does not infringe the rights of any third party.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                More details on how we handle personal data are in our Privacy Policy, which is incorporated by reference into these Terms.
              </p>
            </div>

            {/* Section 6 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                6. Connections with Specialists and Third Parties
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                When you request to be connected with a Specialist through Soradin, you authorize us to share relevant information you have provided with that Specialist so they can contact you and assist with planning.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>Specialists are independent third parties, not employees or agents of Soradin;</li>
                <li>Soradin does not control, supervise, or guarantee any Specialist&apos;s advice, pricing, availability, or services;</li>
                <li>any relationship or contract you enter into with a Specialist or other third party is solely between you and them; and</li>
                <li>Soradin is not responsible for any acts, omissions, errors, or outcomes related to their services.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We may receive compensation (such as referral fees or other benefits) from certain third parties in connection with referrals or introductions made through the Service. This does not mean we endorse or guarantee any particular provider.
              </p>
            </div>

            {/* Section 7 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                7. Fees and No Refunds
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Some parts of the Service may be offered for a fee (for example, premium features, digital products, or other services).
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                All fees are displayed at the time of purchase or subscription.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Unless otherwise stated in writing, all fees are in Canadian dollars (CAD) and are non-refundable.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                By submitting payment information, you authorize Soradin or our third-party payment processor to charge your selected payment method for all fees incurred.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4 font-semibold">
                No Refund Policy:
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Due to the immediate nature of access to digital tools, planning content, or introductions to Specialists, all purchases and fees are final and non-refundable, except where required by applicable law.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                If we change our pricing in the future, we will provide notice of any changes that affect you on a going-forward basis.
              </p>
            </div>

            {/* Section 8 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                8. Intellectual Property
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                The Service, including the design, text, graphics, logos, icons, software, and other content (excluding the content you provide), is owned by Soradin or our licensors and is protected by copyright, trademark, and other laws.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                <li>copy, reproduce, distribute, modify, or create derivative works from the Service;</li>
                <li>use any Soradin trademarks, logos, or branding without our prior written consent; or</li>
                <li>remove or alter any copyright, trademark, or proprietary notices.</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                9. Privacy and Security
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Your use of Soradin is also governed by our Privacy Policy, which explains how we collect, use, and protect your information.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We use reasonable technical and organizational measures to safeguard your data. However, no system can be guaranteed 100% secure, and you acknowledge that you use the Service at your own risk.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                You are responsible for keeping your login credentials secure and for protecting any devices you use to access Soradin.
              </p>
            </div>

            {/* Section 10 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                10. Disclaimers
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                To the fullest extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, whether express or implied.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin does not warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>the Service will be uninterrupted, secure, or error-free;</li>
                <li>any information provided through the Service is complete, current, or free of mistakes;</li>
                <li>any particular outcome will result from using the Service or from working with any Specialist.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin does not provide legal, financial, tax, medical, or funeral home services and is not responsible for how you or any third party choose to interpret or act upon any information made available through the Service.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Some jurisdictions do not allow certain disclaimers, so parts of this section may not apply to you.
              </p>
            </div>

            {/* Section 11 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                11. Limitation of Liability
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>Soradin and its owners, directors, employees, and partners will not be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, data, goodwill, or emotional distress) arising out of or related to your use of the Service, your interactions with Specialists, or these Terms; and</li>
                <li>Soradin&apos;s total aggregate liability for any claims arising out of or relating to the Service or these Terms will not exceed the greater of:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>(a) the amount you have paid to Soradin in the 12 months prior to the event giving rise to the claim; or</li>
                    <li>(b) $100 CAD (or the minimum amount required by law).</li>
                  </ul>
                </li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                You agree that these limitations reflect a reasonable allocation of risk and that they form an essential basis of the agreement between you and Soradin.
              </p>
            </div>

            {/* Section 12 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                12. Indemnification
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                You agree to indemnify, defend, and hold harmless Soradin and its owners, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising out of or related to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mt-4">
                <li>your use of the Service;</li>
                <li>your violation of these Terms;</li>
                <li>your interactions or agreements with any Specialist or third party; or</li>
                <li>any content or information you submit to the Service.</li>
              </ul>
            </div>

            {/* Section 13 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                13. Changes to the Service and to These Terms
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We may update, modify, or discontinue all or part of the Service at any time.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We may also update these Terms from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service after changes become effective constitutes your acceptance of the updated Terms. If you do not agree with any changes, you must stop using the Service.
              </p>
            </div>

            {/* Section 14 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                14. Termination
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                You may stop using the Service at any time.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We may suspend or terminate your access to the Service, with or without notice, if we believe you have violated these Terms, misused the platform, or for any other reason in our discretion.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Even after termination, certain provisions of these Terms will continue to apply, including Sections 5–12 and any other sections which by their nature should survive.
              </p>
            </div>

            {/* Section 15 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                15. Governing Law and Dispute Resolution
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                These Terms and your use of the Service are governed by the laws of the Province of British Columbia and the federal laws of Canada applicable therein, without regard to conflict-of-law principles.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                Any disputes arising out of or relating to these Terms or the Service will be resolved exclusively in the courts located in British Columbia, and you consent to the personal jurisdiction of those courts.
              </p>
            </div>

            {/* Section 16 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                16. Miscellaneous
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Our failure to enforce any right or provision of these Terms is not a waiver of that right or provision.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                These Terms, together with our Privacy Policy and any additional terms or policies referenced herein, constitute the entire agreement between you and Soradin regarding the Service.
              </p>
            </div>

            {/* Section 17 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                17. Contact
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                If you have questions about these Terms, you can contact us at:
              </p>
              <div className="text-[15px] leading-relaxed text-[#5a5a5a] font-light space-y-1">
                <p className="font-medium text-[#1a1a1a]">Soradin</p>
                <p>Email: <a href="mailto:legal@soradin.com" className="text-[#2a2a2a] hover:underline">legal@soradin.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#e5ddd0]/30 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-8 text-center text-xs text-[#7a7a7a] md:flex-row md:justify-between md:text-left font-light tracking-wide">
          <div>
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/privacy" className="hover:text-[#1a1a1a] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#1a1a1a] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

