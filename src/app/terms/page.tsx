import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service | Soradin",
  description: "Soradin Terms of Service - Last updated January 4, 2026",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo and Home Button */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Soradin Logo" 
              width={40} 
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-medium text-[#1A1A1A]">Soradin</span>
          </Link>
          
          <Link 
            href="/"
            className="px-4 py-2 text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors font-medium"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <h1 className="text-center mb-2 text-4xl font-semibold text-[#1a3a2e]">Terms of Service</h1>
            
            <p className="text-center text-gray-600 mb-8">
              Effective Date: January 4, 2026
            </p>

            <div className="space-y-6 text-gray-700">
              <p>
                Welcome to Soradin. These Terms of Service ("Terms") govern your access to and use of the Soradin website, platform, and any related services (collectively, the "Platform").
              </p>

              <p>
                By accessing or using Soradin, you agree to these Terms. If you do not agree, please do not use the Platform.
              </p>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">1. What Soradin Is</h2>
                <p className="mb-3">
                  Soradin is a planning and appointment platform designed to help individuals and families discover information, explore planning options, and connect with independent professionals.
                </p>
                <p className="mb-3">
                  The Platform currently focuses on pre-need funeral planning and is designed to expand into related areas of future planning, including estate planning, financial advising, and insurance services.
                </p>
                <p>
                  Soradin is a technology platform. We do not provide professional, legal, financial, insurance, or funeral services ourselves.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">2. Who Can Use Soradin</h2>
                <p className="mb-3">
                  You must be at least 18 years old to use the Platform.
                </p>
                <p className="mb-2">By using Soradin, you confirm that:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You are legally able to enter into these Terms</li>
                  <li>Any information you provide is accurate and truthful</li>
                  <li>You will use the Platform in good faith</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">3. Role of Professionals on Soradin</h2>
                <p className="mb-3">
                  Professionals listed on Soradin are independent third parties. They are not employees, partners, agents, or representatives of Soradin.
                </p>
                <p className="mb-2">Each professional is solely responsible for:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Their qualifications, licenses, and certifications</li>
                  <li>The services they provide</li>
                  <li>Compliance with all applicable laws and professional standards</li>
                </ul>
                <p>
                  Soradin does not guarantee the availability, quality, or outcome of services offered by professionals on the Platform.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">4. How Appointments Work</h2>
                <p className="mb-3">
                  Soradin allows users to request or book appointments with professionals through the Platform.
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Appointment availability is set by professionals</li>
                  <li>Appointments may be free or paid, depending on the service</li>
                  <li>Payments, if applicable, are processed through third-party providers such as Stripe</li>
                </ul>
                <p>
                  Soradin does not control how professionals conduct appointments or the content of any advice or services provided.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">5. Payments and Billing</h2>
                <p className="mb-2">When payments are required:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>All transactions are processed by third-party payment providers</li>
                  <li>Soradin does not store full payment credentials</li>
                  <li>Fees, billing terms, and refund policies will be clearly disclosed where applicable</li>
                </ul>
                <p>
                  Soradin is not responsible for disputes related to services rendered by professionals. Any disputes should be resolved directly with the professional involved.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">6. Platform Use and Conduct</h2>
                <p className="mb-3">
                  You agree to use Soradin respectfully and lawfully.
                </p>
                <p className="mb-2">You may not:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Misrepresent your identity or intentions</li>
                  <li>Provide false or misleading information</li>
                  <li>Attempt to interfere with the Platform&apos;s security or functionality</li>
                  <li>Scrape, copy, or misuse Platform content or data</li>
                  <li>Use Soradin for unlawful, abusive, or fraudulent purposes</li>
                </ul>
                <p>
                  Soradin may suspend or terminate access if these Terms are violated.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">7. Information and Decision-Making</h2>
                <p className="mb-3">
                  Soradin provides access to information intended to support understanding and informed decision-making. However:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Information on the Platform is not professional advice</li>
                  <li>Planning decisions are personal and context-specific</li>
                  <li>Users are encouraged to ask questions and seek clarification directly from professionals</li>
                </ul>
                <p>
                  Ultimate responsibility for decisions made rests with the user and the professional they choose to work with.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">8. Platform Availability and Limitations</h2>
                <p className="mb-3">
                  We work hard to keep Soradin reliable and accessible, but the Platform may occasionally experience interruptions, delays, or technical issues.
                </p>
                <p className="mb-2">Soradin does not guarantee:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Continuous or error-free access</li>
                  <li>That the Platform will meet every user&apos;s expectations</li>
                  <li>That all information on the Platform is complete or up to date at all times</li>
                </ul>
                <p>
                  Use of the Platform involves inherent risks associated with online services.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">9. Intellectual Property</h2>
                <p className="mb-3">
                  All content, design, branding, software, and materials on Soradin are owned by Soradin Inc. or its licensors.
                </p>
                <p>
                  You may not copy, reproduce, distribute, or create derivative works from the Platform without written permission.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">10. Limitation of Liability</h2>
                <p className="mb-3">
                  To the fullest extent permitted by law, Soradin is not liable for indirect, incidental, or consequential damages arising from use of the Platform.
                </p>
                <p>
                  Soradin&apos;s total liability for any claim shall not exceed the amount paid by you to Soradin, if any, in the twelve months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">11. Changes to These Terms</h2>
                <p className="mb-3">
                  Soradin may update these Terms as the Platform evolves. Updates will be posted on this page with a revised effective date.
                </p>
                <p>
                  Continued use of the Platform constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">12. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict-of-law principles.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">13. Contact</h2>
                <p className="mb-2">Questions about these Terms can be directed to:</p>
                <p className="mb-1">Email: <a href="mailto:support@soradin.com" className="text-gray-900 hover:underline">support@soradin.com</a></p>
                <p>Company: Soradin Inc.</p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2026 Soradin Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}