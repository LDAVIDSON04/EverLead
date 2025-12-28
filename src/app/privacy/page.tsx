import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Soradin",
  description: "Soradin Privacy Policy - Learn how we collect, use, and protect your personal information",
};

export default function PrivacyPage() {
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
              Soradin Privacy Policy
            </h1>
            <p className="text-sm text-[#6b6b6b] font-light mb-6">
              Effective Date: November 23, 2025
            </p>
            <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
              When you use Soradin to plan ahead and, if you choose, connect with pre-planning specialists, you trust us with very sensitive information. We take that seriously.
            </p>
            <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-4">
              This Privacy Policy explains:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mt-4">
              <li>what personal data we collect,</li>
              <li>how we use it,</li>
              <li>who we share it with,</li>
              <li>how we protect it, and</li>
              <li>what choices you have.</li>
            </ul>
            <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6">
              By using Soradin&apos;s website, tools, and services, you agree to this Privacy Policy.
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            {/* Section 1 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                1. Who We Are
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin (&quot;Soradin,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a digital pre-planning platform. We help individuals:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>answer a guided questionnaire about their funeral and pre-need preferences, and</li>
                <li>if they choose, be connected with trusted pre-planning specialists and related professionals.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>our main website and any web pages that link to this Privacy Policy,</li>
                <li>our online questionnaires and forms,</li>
                <li>lead/connection services to third-party professionals, and</li>
                <li>email, messaging, and other communications related to these services.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                This Privacy Policy applies only to Soradin&apos;s own services. If you work directly with a funeral home, insurance company, lawyer, or other professional, their own privacy policies govern how they handle your data.
              </p>
            </div>

            {/* Section 2 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                2. What We Mean by &quot;Personal Data&quot;
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                In this Privacy Policy, &quot;personal data&quot; means any information that identifies you or could reasonably be linked to you or your household, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>your name and contact details,</li>
                <li>information about your wishes and preferences,</li>
                <li>identifiers like IP address or device ID, and</li>
                <li>data about how you use our website and questionnaire.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                It does not include aggregated or de-identified data that cannot reasonably be used to identify you.
              </p>
            </div>

            {/* Section 3 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                3. Personal Data We Collect and How We Use It
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-6">
                The information we collect—and how we use it—depends on how you interact with Soradin (for example, just visiting the site vs. filling out the questionnaire).
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">3.1 Information You Give Us Directly</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    We collect personal data when you:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Use our questionnaire or forms</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-3">
                        <li>Name and contact details (such as email, phone)</li>
                        <li>Your funeral and pre-planning preferences</li>
                        <li>Notes or messages you add for your family or professionals</li>
                      </ul>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">How we use it:</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        <li>to generate and store your pre-planning record,</li>
                        <li>to show you or send you a summary of your wishes,</li>
                        <li>to connect you with pre-planning specialists if you ask us to,</li>
                        <li>to improve and personalize our services.</li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Create an account (if applicable)</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-3">
                        <li>Email, password, and basic profile details</li>
                        <li>Internal IDs that let our systems keep your information tied to your account</li>
                      </ul>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">How we use it:</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        <li>to create and manage your account,</li>
                        <li>to let you sign in and view or update your information,</li>
                        <li>to contact you about your account and services.</li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Contact us or request support</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-3">
                        <li>Name and contact details</li>
                        <li>Contents of your message (questions, concerns, feedback)</li>
                        <li>If we use phone or chat, we may collect call logs and, where permitted by law, recordings or transcripts.</li>
                      </ul>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">How we use it:</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        <li>to respond to your questions,</li>
                        <li>to provide support,</li>
                        <li>to improve our services and user experience.</li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Subscribe to updates or marketing</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-3">
                        <li>Email address and sometimes your name or general preferences</li>
                      </ul>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">How we use it:</p>
                      <ul className="list-disc list-inside space-y-1 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        <li>to send you service updates, resources, and marketing communications (where permitted),</li>
                        <li>you can opt out of marketing at any time (see Section 6).</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6">
                    We may also receive some of this information indirectly from payment processors, communication providers, or other service partners acting on our behalf.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">3.2 Information We Collect Automatically</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    Like most online services, we automatically collect certain information when you visit or use Soradin, such as:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>IP address and general location (e.g., city or region)</li>
                    <li>browser type and device type</li>
                    <li>pages viewed, links clicked, and time spent on the site</li>
                    <li>when and how you interact with features (including the questionnaire)</li>
                    <li>log data (timestamps, referrer pages, error logs, etc.)</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    We use cookies, pixels, and similar technologies to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>make the site work reliably,</li>
                    <li>remember your preferences,</li>
                    <li>understand which parts of the site are most useful,</li>
                    <li>improve performance and design, and</li>
                    <li>(if you choose to allow it) support analytics and advertising.</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    See Section 7 for more about tracking and advertising.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">3.3 Information from Third Parties</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    We may also receive personal data about you from:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Service providers</p>
                      <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        such as payment processors, email services, analytics tools, and hosting providers—mainly to process payments, send emails, and keep the platform running securely.
                      </p>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Professionals we connect you with</p>
                      <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        For example, a pre-planning specialist may let us know that a consultation occurred or that a plan was started, so we can improve our matching and service quality. We do not control what those professionals do with your information; their own privacy policies apply.
                      </p>
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Public or open sources</p>
                      <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                        such as public records or content you make public (for example, tagging us on social media), which we may use for market research, security, or service improvements.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">3.4 How We Use Personal Data (Summary)</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    In addition to the specific uses above, we use personal data to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>provide and operate the Soradin service,</li>
                    <li>generate and maintain your pre-planning record,</li>
                    <li>connect you with pre-planning specialists when you ask us to,</li>
                    <li>maintain the security and integrity of our systems,</li>
                    <li>perform analytics and improve our website and services,</li>
                    <li>detect, prevent, and respond to fraud, misuse, or legal issues,</li>
                    <li>comply with legal obligations and enforce our Terms of Service, and</li>
                    <li>communicate with you about updates, features, and relevant offerings (where allowed).</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    We may also use de-identified or aggregated data for research and business purposes. This data does not identify you personally.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                4. How We Share Personal Data
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-6">
                We do not sell your personal data. We may share your information in these situations:
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">4.1 With Pre-Planning Specialists (At Your Request)</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    If you ask us to connect you with a pre-planning specialist or similar professional, we may share:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>your name and contact details,</li>
                    <li>relevant pre-planning preferences from your questionnaire, and</li>
                    <li>any additional information reasonably needed to respond to your request.</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    Once shared, those specialists handle your data under their own privacy policies and legal obligations. Soradin is not responsible for how third parties use your information once you choose to engage with them.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">4.2 With Service Providers</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    We work with trusted third-party vendors who help us run Soradin, such as:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>hosting and cloud providers,</li>
                    <li>analytics and performance tools,</li>
                    <li>email and communication services,</li>
                    <li>customer support tools, and</li>
                    <li>payment processors (if applicable).</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    These providers may access personal data only to perform services for us and are not permitted to use it for their own independent purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">4.3 For Legal, Security, and Business Reasons</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                    We may share personal data when we believe it is reasonably necessary to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                    <li>comply with laws, legal processes, or government requests,</li>
                    <li>enforce our Terms of Service or other agreements,</li>
                    <li>investigate or prevent fraud, security incidents, or abuse,</li>
                    <li>protect the rights, property, or safety of Soradin, our users, or others, or</li>
                    <li>in connection with a business transaction (such as a merger, acquisition, or transfer of assets).</li>
                  </ul>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    If Soradin is involved in such a transaction, your information may be transferred as part of that process, subject to similar privacy commitments.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#1a1a1a] mb-3">4.4 With Your Consent or at Your Direction</h3>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                    We may share your information with other parties when you ask us to, or when you clearly consent to that sharing.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                5. How We Protect Your Data and How Long We Keep It
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We use reasonable technical and organizational safeguards to protect personal data, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>HTTPS encryption in transit,</li>
                <li>secure hosting environments,</li>
                <li>access controls and authentication, and</li>
                <li>internal policies and monitoring.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                However, no system is completely secure, and we cannot guarantee absolute security.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We keep your personal data only as long as reasonably necessary to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>provide and improve the service,</li>
                <li>maintain your account and records,</li>
                <li>meet legal, tax, and regulatory requirements, and</li>
                <li>resolve disputes and enforce our agreements.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                When data is no longer needed, we will delete it or de-identify it where reasonably possible.
              </p>
            </div>

            {/* Section 6 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                6. Your Choices and Rights
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Your options may depend on where you live, but generally you have the ability to:
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Access and update your information</p>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                    If you have an account, you can review and edit some information directly in your account settings. You can also contact us to request access or updates.
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Control marketing communications</p>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                    You can unsubscribe from marketing emails at any time by using the link in the email or contacting us. We may still send you non-marketing messages about your account or service (for example, confirmations or legal notices).
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Control cookies and tracking</p>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                    You can adjust your browser or device settings to block or delete cookies, and you may have options to limit certain tracking or ad personalization. Doing so may impact how some features work.
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#1a1a1a] mb-2">Request deletion or restriction</p>
                  <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4">
                    Depending on your jurisdiction, you may have rights to request deletion of your personal data or to limit certain processing. We will respond to such requests in line with applicable laws.
                  </p>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mt-6">
                To exercise any of these rights, you can contact us at <a href="mailto:support@soradin.com" className="text-[#2a2a2a] hover:underline">support@soradin.com</a>.
              </p>
            </div>

            {/* Section 7 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                7. Cookies, Analytics, and Interest-Based Advertising
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We and our service providers may use cookies, pixels, and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>remember your settings and preferences,</li>
                <li>understand how users navigate the site,</li>
                <li>measure which pages and features are most used,</li>
                <li>improve performance and design, and</li>
                <li>support advertising and remarketing (if we choose to run ads).</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                If we use interest-based advertising, we may:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-[#5a5a5a] font-light ml-4 mb-4">
                <li>share limited identifiers (like a hashed email or device ID) with advertising partners, and</li>
                <li>allow those partners to show Soradin ads on other websites or apps based on your interactions with our site.</li>
              </ul>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                You can usually manage cookies in your browser settings and may have choices to limit ad personalization in your device settings or through industry opt-out tools. Some features may not work properly if you disable certain cookies.
              </p>
            </div>

            {/* Section 8 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                8. Children&apos;s Privacy
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin is not intended for children under 18, and we do not knowingly collect personal data from minors.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                If we learn that a child under 18 has provided personal data through the Service, we will take reasonable steps to delete it. If you believe a minor has provided personal data to us, please contact us at <a href="mailto:support@soradin.com" className="text-[#2a2a2a] hover:underline">support@soradin.com</a>.
              </p>
            </div>

            {/* Section 9 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                9. Region-Specific Disclosures
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Depending on where you live, you may have additional rights under local privacy laws (for example, rights to access, correct, delete, or restrict processing of your personal data).
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We will honor these rights where required by law. If you wish to exercise such rights, please contact us and tell us your place of residence so we can handle your request under the correct legal framework.
              </p>
            </div>

            {/* Section 10 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                10. Third-Party Websites and Services
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                Soradin may link to websites or services that we do not operate (for example, professional sites, payment services, or resources). This Privacy Policy does not apply to those third-party services, and we are not responsible for their privacy practices.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                We encourage you to review the privacy policies of any third-party websites or services you visit.
              </p>
            </div>

            {/* Section 11 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                11. Changes to This Privacy Policy
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                We may update this Privacy Policy from time to time. When we do, we will change the &quot;Effective Date&quot; at the top.
              </p>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light">
                If we make material changes, we will provide notice through our website or other appropriate methods. Your continued use of Soradin after changes take effect means you accept the updated Privacy Policy. If you do not agree, you should stop using the Service.
              </p>
            </div>

            {/* Section 12 */}
            <div className="rounded-2xl border border-[#e5ddd0]/60 bg-white/40 backdrop-blur-sm p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <h2
                className="text-2xl font-light text-[#1a1a1a] mb-4 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                12. Contact Us
              </h2>
              <p className="text-[15px] leading-relaxed text-[#5a5a5a] font-light mb-4">
                If you have questions, requests, or concerns about this Privacy Policy or how we handle your data, you can contact us at:
              </p>
              <div className="text-[15px] leading-relaxed text-[#5a5a5a] font-light space-y-1">
                <p className="font-medium text-[#1a1a1a]">Soradin</p>
                <p>Email: <a href="mailto:support@soradin.com" className="text-[#2a2a2a] hover:underline">support@soradin.com</a></p>
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

