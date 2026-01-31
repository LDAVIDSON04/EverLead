"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default function CreateAccountSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <header className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={96}
            height={96}
            className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
          />
          <span className="text-xl font-semibold text-[#1A1A1A]">Soradin</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 py-12 sm:py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1a3a2e] flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Application submitted
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            Your account has been submitted for approval. We&apos;ll review your information and get back to you soon. You can log in once your account is approved.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1a3a2e] text-white font-medium py-3.5 px-8 rounded-xl hover:bg-[#0f2a20] transition-colors shadow-sm hover:shadow-md"
          >
            Return to home
          </Link>
        </div>
      </main>
    </div>
  );
}
