import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "SSL Certificate | Soradin",
  description: "Soradin uses SSL/TLS encryption to secure your connection and protect your data.",
};

export default function SSLPage() {
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
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-semibold text-[#1a3a2e]">SSL Certificate</h1>
          <p className="text-gray-500">
            Secure connection and data protection
          </p>
        </div>

        <div className="space-y-4 text-sm leading-tight text-gray-600">
          <p>
            Soradin uses SSL/TLS (Secure Sockets Layer / Transport Layer Security) encryption to secure all connections to our website. When you see the padlock icon in your browser&apos;s address bar, your session is encrypted and your data is protected in transit.
          </p>
          <p>
            This helps ensure that personal information, login credentials, and payment details are transmitted securely between your device and our servers.
          </p>
          <p>
            For questions about security, contact{" "}
            <a href="mailto:support@soradin.com" className="text-[#1a3a2e] hover:underline">
              support@soradin.com
            </a>
            . Company: Soradin Inc.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Soradin Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
