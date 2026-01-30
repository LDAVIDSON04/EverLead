"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

export default function CreateAccountNextPage() {
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [howYouHelp, setHowYouHelp] = useState("");
  const [whatFamiliesAppreciate, setWhatFamiliesAppreciate] = useState("");
  const [hasAnsweredAccurately, setHasAnsweredAccurately] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to signup/approval API
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
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

      {/* Form Container */}
      <div className="max-w-[1000px] mx-auto px-8 py-12 flex-1 w-full">
        <h1 className="text-3xl mb-4">Create an account</h1>

        {/* Progress Indicator - Step 3 of 3 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-neutral-700" />
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium">Business Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-neutral-700" />
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white text-sm font-medium">
                3
              </div>
              <span className="font-medium">Profile Bio</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-black mb-6">Step 3: Profile Bio</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Years of Experience */}
          <div>
            <label htmlFor="years" className="block text-sm mb-2">
              Years of experience <span className="text-red-600">*</span>
            </label>
            <input
              id="years"
              type="number"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              min={0}
              required
            />
          </div>

          {/* How do you typically help families */}
          <div>
            <label htmlFor="help" className="block text-sm mb-2">
              How do you typically help families? (200 chars max) <span className="text-red-600">*</span>
            </label>
            <textarea
              id="help"
              value={howYouHelp}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setHowYouHelp(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={2}
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {howYouHelp.length}/200
            </div>
          </div>

          {/* What do families appreciate most */}
          <div>
            <label htmlFor="appreciate" className="block text-sm mb-2">
              What do families appreciate most about your approach? (200 chars max) <span className="text-red-600">*</span>
            </label>
            <textarea
              id="appreciate"
              value={whatFamiliesAppreciate}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setWhatFamiliesAppreciate(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={2}
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {whatFamiliesAppreciate.length}/200
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="accurate"
              type="checkbox"
              checked={hasAnsweredAccurately}
              onChange={(e) => setHasAnsweredAccurately(e.target.checked)}
              className="mt-1 w-4 h-4 cursor-pointer appearance-none border border-gray-300 rounded bg-white checked:bg-black checked:border-black"
              required
            />
            <label htmlFor="accurate" className="text-sm cursor-pointer">
              I have answered all questions accurately <span className="text-red-600">*</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-md font-medium hover:bg-gray-900 transition-colors mt-8"
          >
            Submit for approval
          </button>

          {/* Log in link */}
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/agent" className="underline text-black hover:text-gray-700">
              Log in
            </Link>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
