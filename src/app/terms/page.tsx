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
            className="px-4 py-2 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors font-medium"
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
                Welcome to Soradin. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Soradin website, platform, and any related services (collectively, the &quot;Platform&quot;).
              </p>

              <p>
                By accessing or using Soradin, you agree to these Terms. If you do not agree with these Terms, please do not use the Platform.
              </p>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">1. About Soradin</h2>
                <p className="mb-3">
                  Soradin is a technology platform designed to help individuals and families learn about estate planning and connect with professionals who provide related services.
                </p>
                <p className="mb-3">
                  The Platform allows users to discover information, explore planning options, and schedule meetings with professionals involved in estate planning, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Estate lawyers</li>
                  <li>Financial advisors</li>
                  <li>Funeral pre-planning professionals</li>
                  <li>Insurance advisors</li>
                  <li>Tax accountants</li>
                </ul>
                <p className="mb-3">
                  Soradin provides educational resources and scheduling tools to facilitate connections between users and professionals.
                </p>
                <p>
                  Soradin does not provide legal, financial, insurance, funeral, or other professional services. All services are provided directly by the professionals listed on the Platform.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">2. Eligibility</h2>
                <p className="mb-3">
                  To use the Platform, you must be at least 18 years of age.
                </p>
                <p className="mb-2">By using Soradin, you represent and warrant that:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You are legally capable of entering into these Terms</li>
                  <li>The information you provide is accurate and truthful</li>
                  <li>You will use the Platform in accordance with applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">3. Users and Professionals</h2>
                <p className="mb-3">
                  Soradin may be used by both individuals seeking information or services (&quot;Users&quot;) and professionals offering services (&quot;Professionals&quot;).
                </p>
                <p className="mb-3">
                  Professionals using the Platform may include lawyers, financial advisors, insurance professionals, funeral planning professionals, tax accountants, or other specialists involved in estate planning.
                </p>
                <p className="mb-2">Professionals are responsible for ensuring that they:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Hold all required licenses or certifications</li>
                  <li>Comply with applicable laws and professional regulations</li>
                  <li>Provide accurate information about their qualifications and services</li>
                  <li>Ensure their services comply with the laws and professional regulations of their respective province or territory</li>
                </ul>
                <p className="mt-3">
                  Soradin does not independently verify all professional credentials and does not guarantee the quality, legality, or outcome of services provided by professionals.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">4. Professional Independence</h2>
                <p className="mb-3">
                  Professionals listed on the Platform operate independently.
                </p>
                <p className="mb-3">
                  Professionals are not employees, agents, partners, or representatives of Soradin.
                </p>
                <p>
                  Any advice, services, or recommendations provided by a professional are solely the responsibility of that professional.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">5. Appointments and Scheduling</h2>
                <p className="mb-3">
                  Soradin allows Users to view professional profiles and schedule appointments with Professionals through the Platform.
                </p>
                <p className="mb-2">Professionals control their own:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Availability</li>
                  <li>Services offered</li>
                  <li>Appointment scheduling</li>
                </ul>
                <p>
                  Soradin provides the technology that enables scheduling but does not participate in the professional services provided during or after appointments.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">6. Payments</h2>
                <p className="mb-3">
                  Some services offered by Professionals may involve fees.
                </p>
                <p className="mb-2">Where payments are processed through the Platform:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Payments may be handled by third-party payment processors such as Stripe</li>
                  <li>Soradin does not store full payment card information</li>
                  <li>Pricing and refund policies are determined by the Professional providing the service unless otherwise specified</li>
                </ul>
                <p>
                  Soradin is not responsible for disputes between Users and Professionals regarding services provided.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">7. Educational Content</h2>
                <p className="mb-3">
                  Soradin may provide articles, blog posts, guides, or other informational content intended to help users better understand estate planning topics.
                </p>
                <p className="mb-3">
                  All content provided on the Platform is for informational and educational purposes only and should not be considered legal, financial, insurance, or professional advice.
                </p>
                <p>
                  Users should consult qualified professionals before making decisions related to estate planning or financial matters.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">8. Professional Content and Blog Contributions</h2>
                <p className="mb-3">
                  Professionals may have the ability to submit articles or educational content for publication on the Platform.
                </p>
                <p className="mb-3">
                  All submitted content is subject to review and approval by Soradin before publication.
                </p>
                <p className="mb-2">
                  Content must be educational in nature and relevant to estate planning topics. Soradin may remove or refuse to publish content that:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Is promotional or misleading</li>
                  <li>Violates professional standards</li>
                  <li>Includes inappropriate or unrelated material</li>
                </ul>
                <p>
                  Soradin reserves the right to edit or remove content at its discretion.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">9. Platform Use</h2>
                <p className="mb-3">
                  You agree to use the Platform responsibly and lawfully.
                </p>
                <p className="mb-2">You may not:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Provide false or misleading information</li>
                  <li>Misrepresent your identity or credentials</li>
                  <li>Attempt to interfere with the Platform&apos;s functionality or security</li>
                  <li>Copy, scrape, or misuse Platform content or data</li>
                  <li>Use the Platform for unlawful, fraudulent, or abusive purposes</li>
                </ul>
                <p>
                  Soradin reserves the right to suspend or terminate access to the Platform if these Terms are violated.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">10. Platform Availability</h2>
                <p className="mb-3">
                  Soradin works to keep the Platform accessible and reliable, but availability cannot be guaranteed.
                </p>
                <p className="mb-2">The Platform may occasionally experience:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Maintenance or updates</li>
                  <li>Technical interruptions</li>
                  <li>Temporary outages</li>
                </ul>
                <p>
                  Soradin does not guarantee uninterrupted or error-free operation.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">11. Intellectual Property</h2>
                <p className="mb-3">
                  All content, branding, software, and materials associated with Soradin are owned by Soradin Inc. or its licensors.
                </p>
                <p>
                  You may not copy, reproduce, distribute, modify, or create derivative works from the Platform without prior written permission from Soradin.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">12. Limitation of Liability</h2>
                <p className="mb-3">
                  To the fullest extent permitted by law, Soradin shall not be liable for indirect, incidental, consequential, or special damages arising from the use of the Platform.
                </p>
                <p>
                  Soradin&apos;s total liability for any claim relating to the Platform shall not exceed the amount paid by you to Soradin, if any, in the twelve months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">13. Changes to These Terms</h2>
                <p className="mb-3">
                  Soradin may update these Terms as the Platform evolves.
                </p>
                <p className="mb-3">
                  Updated Terms will be posted on this page with a revised effective date.
                </p>
                <p>
                  Continued use of the Platform after updates constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">14. Governing Law</h2>
                <p className="mb-3">
                  These Terms are governed by and interpreted in accordance with the laws of the Province of Ontario and the laws of Canada applicable therein, without regard to conflict of law principles.
                </p>
                <p>
                  Any disputes arising from these Terms or the use of the Platform shall be subject to the exclusive jurisdiction of the courts located in Ontario, Canada.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">15. Contact</h2>
                <p className="mb-2">If you have questions about these Terms, please contact:</p>
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
