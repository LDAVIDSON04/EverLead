"use client";

import Link from "next/link";
import Image from "next/image";

export default function CreateAccountSuccessPage() {

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-8 pt-8 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
          />
          <span className="font-semibold text-black">Soradin</span>
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-8 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Application submitted
        </h1>
        <p className="text-gray-600 mb-8">
          Your account has been submitted for approval. We&apos;ll review your information and get back to you soon. You can log in once your account is approved.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white font-medium py-3 px-6 rounded-md hover:bg-gray-800 transition-colors"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}
