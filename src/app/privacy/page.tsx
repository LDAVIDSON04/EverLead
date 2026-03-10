import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | Soradin",
  description: "Soradin Privacy Policy - Learn how we collect, use, and protect your personal information",
};

export default function PrivacyPage() {
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
            <h1 className="text-center mb-2 text-4xl font-semibold text-[#1a3a2e]">Privacy Policy</h1>
            <p className="text-center text-gray-600 mb-8">
              Last Updated: January 4, 2026
            </p>

            <div className="space-y-6 text-gray-700">
              <p>
                Soradin is committed to protecting your privacy and handling personal information responsibly. This Privacy Policy explains how we collect, use, disclose, and safeguard personal information when you access or use the Soradin website, platform, and related services (collectively, the &quot;Platform&quot;).
              </p>
              <p>
                By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">1. Information We Collect</h2>
                <p className="mb-2 font-medium text-gray-900">Information You Provide Directly</p>
                <p className="mb-3">
                  When you use Soradin, you may voluntarily provide personal information, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Appointment details and preferences</li>
                  <li>Information submitted through forms or onboarding processes</li>
                  <li>Professional profile information (for professionals)</li>
                  <li>Communications sent through the Platform</li>
                </ul>
                <p className="mb-3">
                  Professionals using the Platform may also provide business information such as office location, professional credentials, licensing information, and service descriptions.
                </p>
                <p className="mb-2 font-medium text-gray-900">Account Information</p>
                <p className="mb-3">
                  If you create an account on the Platform, we may collect account-related information including login credentials, profile details, and other information necessary to manage your account.
                </p>
                <p className="mb-2 font-medium text-gray-900">Automatically Collected Information</p>
                <p className="mb-2">
                  When you access Soradin, certain technical and usage information may be collected automatically, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>IP address and device identifiers</li>
                  <li>Browser type and operating system</li>
                  <li>Pages viewed and actions taken on the Platform</li>
                  <li>Time spent on the Platform</li>
                  <li>Referring websites or links</li>
                </ul>
                <p>
                  This information helps us improve platform performance, security, and user experience.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">2. How We Use Your Information</h2>
                <p className="mb-2">Soradin uses personal information to:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Provide and operate the Platform</li>
                  <li>Facilitate appointment scheduling and communication between users and professionals</li>
                  <li>Process payments through third-party providers where applicable</li>
                  <li>Send service-related communications such as confirmations and reminders</li>
                  <li>Improve platform functionality and user experience</li>
                  <li>Respond to inquiries and provide customer support</li>
                  <li>Maintain platform security and prevent misuse</li>
                  <li>Comply with legal, regulatory, and tax obligations</li>
                </ul>
                <p>Soradin does not sell personal information to third parties.</p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">3. Sharing and Disclosure of Information</h2>
                <p className="mb-3">
                  Soradin may share personal information only when necessary to operate the Platform.
                </p>
                <p className="mb-2">This may include sharing information:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>With professionals you choose to book or contact through the Platform</li>
                  <li>With service providers that help operate the Platform, including hosting providers, analytics providers, and payment processors</li>
                  <li>When required by law, regulation, legal process, or government request</li>
                  <li>To protect the rights, safety, or security of Soradin, its users, or the public</li>
                </ul>
                <p className="mb-3">
                  When users schedule appointments through the Platform, relevant information may be shared with the professional in order to facilitate the appointment.
                </p>
                <p>All service providers are expected to handle information in accordance with applicable privacy laws.</p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">4. Payments and Financial Information</h2>
                <p className="mb-3">
                  Payments for services may be processed by third-party payment providers such as Stripe.
                </p>
                <p>
                  Soradin does not store full credit card numbers or sensitive payment credentials on its own servers. Payment providers may collect and process information in accordance with their own privacy policies.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">5. Data Security</h2>
                <p className="mb-3">
                  Soradin uses reasonable administrative, technical, and organizational safeguards to protect personal information from unauthorized access, misuse, loss, or disclosure.
                </p>
                <p>
                  Despite these safeguards, no internet-based system can be completely secure. Users acknowledge that information transmitted online carries inherent security risks.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">6. Data Storage and International Transfers</h2>
                <p className="mb-3">
                  Personal information may be stored or processed in Canada or in other jurisdictions where Soradin or its service providers operate.
                </p>
                <p>
                  When information is transferred outside of Canada, it may be subject to the laws of the jurisdiction in which it is processed.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">7. Data Retention</h2>
                <p className="mb-2">Personal information is retained only for as long as necessary to:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Provide the Platform and its services</li>
                  <li>Fulfill contractual or legal obligations</li>
                  <li>Resolve disputes</li>
                  <li>Enforce agreements</li>
                </ul>
                <p>
                  When information is no longer required, it may be securely deleted or anonymized.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">8. Your Privacy Rights</h2>
                <p className="mb-2">Depending on your jurisdiction and applicable laws, you may have the right to:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Request access to personal information held about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of personal data where applicable</li>
                  <li>Withdraw consent where data processing relies on consent</li>
                </ul>
                <p>Requests may be submitted by contacting Soradin using the contact information below.</p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">9. Cookies and Analytics</h2>
                <p className="mb-2">Soradin uses cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Maintain platform functionality</li>
                  <li>Understand usage patterns</li>
                  <li>Improve performance and user experience</li>
                </ul>
                <p className="mb-3">
                  Analytics tools may also be used to better understand how users interact with the Platform.
                </p>
                <p>
                  You may control cookies through your browser settings, though disabling cookies may affect certain platform features.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">10. Children&apos;s Privacy</h2>
                <p className="mb-3">
                  Soradin is not intended for individuals under the age of 18.
                </p>
                <p>
                  We do not knowingly collect personal information from individuals under 18. If such information is discovered, it will be removed.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">11. Changes to This Privacy Policy</h2>
                <p className="mb-3">
                  Soradin may update this Privacy Policy from time to time.
                </p>
                <p>
                  Updated versions will be posted on this page with a revised &quot;Last Updated&quot; date. Continued use of the Platform after changes are posted constitutes acceptance of the revised policy.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-semibold text-gray-900">12. Contact Information</h2>
                <p className="mb-2">If you have questions or concerns about this Privacy Policy or Soradin&apos;s data practices, please contact:</p>
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
