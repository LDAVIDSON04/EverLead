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
            className="px-4 py-2 text-[#1A1A1A] hover:text-[#1e3a5f] transition-colors font-medium"
          >
            Home
            </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-semibold text-[#1a3a2e]">Privacy Policy</h1>
          <p className="text-gray-500">
            Last updated: January 4, 2026
          </p>
        </div>

        <div className="space-y-4 text-sm leading-tight text-gray-600">
          <div>
            <p className="mb-3">
              Soradin is committed to protecting your privacy and handling personal information responsibly. This Privacy Policy explains how we collect, use, disclose, and safeguard personal information when you access or use the Soradin platform.
            </p>
          </div>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">1. Information We Collect</h2>
            <p className="mb-1">
              <strong>Information You Provide Directly</strong>
            </p>
            <p className="mb-1">
              When you use Soradin, you may voluntarily provide personal information, including but not limited to: name, email address, phone number; appointment details and preferences; information submitted through forms or onboarding processes; professional profile details (for professionals); communications sent through the platform.
            </p>
            <p className="mb-1">
              <strong>Automatically Collected Information</strong>
            </p>
            <p className="mb-1">
              When you access Soradin, we may automatically collect certain technical and usage information, including: IP address and device identifiers; browser type, operating system, and device information; pages viewed, actions taken, and time spent on the platform; referring URLs and interaction data. This information helps us improve performance, security, and user experience.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">2. How We Use Your Information</h2>
            <p className="mb-1">
              Soradin uses personal information to: provide and operate the platform; facilitate appointment scheduling and communication; process payments and billing through third-party providers; send transactional communications (such as confirmations and reminders); improve platform functionality and user experience; respond to inquiries and provide customer support; comply with legal, regulatory, and tax obligations. Soradin does not sell personal information.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">3. Sharing and Disclosure of Information</h2>
            <p className="mb-1">
              Soradin may share personal information only when necessary to operate the platform, including: with professionals you choose to book or contact; with trusted service providers (such as payment processors, hosting providers, analytics services); when required by law, regulation, or legal process; to protect the rights, safety, or integrity of Soradin, users, or the public. All third-party service providers are required to handle information in a manner consistent with applicable privacy laws.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">4. Payments and Financial Information</h2>
            <p className="mb-1">
              Payment transactions on Soradin are processed by third-party payment processors such as Stripe. Soradin does not store full credit card numbers or sensitive payment credentials on its own servers. Payment providers may collect and process information in accordance with their own privacy policies.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">5. Data Security</h2>
            <p className="mb-1">
              Soradin uses reasonable administrative, technical, and organizational safeguards to protect personal information against unauthorized access, misuse, loss, or disclosure. Despite these measures, no system can be guaranteed to be completely secure. Users acknowledge that information transmitted online carries inherent risk.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">6. Data Retention</h2>
            <p className="mb-1">
              Personal information is retained only for as long as necessary to: provide the Service; fulfill contractual or legal obligations; resolve disputes; enforce agreements. When information is no longer required, it is securely deleted or anonymized.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">7. Your Privacy Rights</h2>
            <p className="mb-1">
              Depending on your jurisdiction, you may have the right to: request access to personal information; request correction of inaccurate information; request deletion of personal data; withdraw consent where applicable. Requests can be submitted by contacting Soradin directly.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">8. Cookies and Analytics</h2>
            <p className="mb-1">
              Soradin uses cookies and similar technologies to: maintain platform functionality; understand usage patterns; improve performance and user experience. You may control cookies through your browser settings. Disabling cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">9. Children&apos;s Privacy</h2>
            <p className="mb-1">
              Soradin is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-gray-700 mb-1 font-semibold">10. Changes to This Privacy Policy</h2>
            <p className="mb-1">
              Soradin may update this Privacy Policy from time to time. Updates will be posted on this page with an updated revision date. Continued use of the platform constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-gray-700 mb-1 font-semibold">11. Contact Information</h2>
            <p className="mb-1">
              For questions or concerns regarding privacy or data handling, contact: Email: <a href="mailto:support@soradin.com" className="text-gray-700 hover:underline">support@soradin.com</a>. Company: Soradin Inc.
            </p>
          </section>
              </div>
            </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">© 2026 Soradin Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}