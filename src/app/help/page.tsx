import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help - Soradin',
  description: 'Get help and support for using Soradin',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-5xl font-semibold text-[#1A1A1A] mb-8 tracking-tight">
          Help & Support
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-[#1A1A1A]/5 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[#1A1A1A]/70 leading-relaxed">
            We're here to help. If you have questions or need assistance, please reach out to our support team.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#1A1A1A]/5 p-8">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            Contact Support
          </h2>
          <p className="text-[#1A1A1A]/70 leading-relaxed mb-4">
            Email us at <a href="mailto:support@soradin.com" className="text-[#0C6F3C] hover:underline">support@soradin.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
