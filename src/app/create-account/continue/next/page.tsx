"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

const CREATE_ACCOUNT_DRAFT_KEY = "createAccountDraft";

export default function CreateAccountNextPage() {
  const router = useRouter();
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [howYouHelp, setHowYouHelp] = useState("");
  const [whatFamiliesAppreciate, setWhatFamiliesAppreciate] = useState("");
  const [hasAnsweredAccurately, setHasAnsweredAccurately] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(CREATE_ACCOUNT_DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : null;
      if (!draft?.step1 || !draft?.step2) {
        router.replace("/create-account");
      }
    } catch {
      router.replace("/create-account");
    }
  }, [mounted, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasAnsweredAccurately) {
      setError("Please confirm you have answered all questions accurately.");
      return;
    }

    let draft: { step1?: any; step2?: any } = {};
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(CREATE_ACCOUNT_DRAFT_KEY) : null;
      if (!raw) {
        setError("Session expired. Please start from step 1.");
        router.replace("/create-account");
        return;
      }
      draft = JSON.parse(raw);
    } catch {
      setError("Session expired. Please start from step 1.");
      router.replace("/create-account");
      return;
    }

    const step1 = draft.step1;
    const step2 = draft.step2;
    if (!step1 || !step2) {
      setError("Missing previous steps. Please start from step 1.");
      router.replace("/create-account");
      return;
    }

    const full_name = [step1.firstName, step1.lastName].filter(Boolean).join(" ").trim();
    if (!full_name) {
      setError("Please complete step 1 with your name.");
      return;
    }

    const address = {
      street: step1.homeAddress || "",
      city: step1.city || "",
      province: step1.province || "",
      postalCode: step1.postalCode || "",
    };
    const notification_cities = step1.city && step1.province
      ? [{ city: step1.city, province: step1.province }]
      : [];

    // Same labels as the profession dropdown on create-account (so admin shows what they picked)
    const specialtyFromRole: Record<string, string> = {
      "funeral-planner": "Funeral Planner",
      "lawyer": "Lawyer",
      "insurance-broker": "Insurance Broker",
      "financial-advisor": "Financial Advisor",
    };

    const metadata: Record<string, unknown> = {
      agent_role: step2.selectedRole || "",
      specialty: step2.selectedRole ? (specialtyFromRole[step2.selectedRole] ?? "Funeral Planner") : "",
      business_name: (step2.businessName || "").trim(),
      bio: {
        years_of_experience: String(yearsOfExperience).trim(),
        practice_philosophy_help: howYouHelp.trim(),
        practice_philosophy_appreciate: whatFamiliesAppreciate.trim(),
      },
    };

    if (step2.selectedRole === "funeral-planner") {
      metadata.trustage_enroller_number = step2.hasTruStage === "yes";
      metadata.llqp_license = step2.hasLLQP === "yes";
      metadata.llqp_quebec = step2.llqpQuebec || "";
    }
    if (step2.selectedRole === "lawyer") {
      metadata.law_society_name = step2.lawSocietyName || "";
      metadata.authorized_provinces = step2.authorizedProvinces || "";
    }
    if (step2.selectedRole === "insurance-broker") {
      metadata.licensing_province = step2.licensingProvince || "";
      metadata.has_multiple_provinces = step2.hasMultipleProvinces === "yes";
      metadata.additional_provinces = step2.additionalProvinces || "";
    }
    if (step2.selectedRole === "financial-advisor") {
      metadata.regulatory_organization = step2.regulatoryOrganization || "";
      metadata.registered_provinces = step2.registeredProvinces || "";
    }

    const office_locations = Array.isArray(step2.officeLocations)
      ? step2.officeLocations.map((loc: { name?: string; street_address?: string; city?: string; province?: string; postal_code?: string }) => ({
          name: loc.name || "",
          street_address: loc.street_address || null,
          city: loc.city || "",
          province: loc.province || "",
          postal_code: loc.postal_code || null,
        }))
      : [];

    const signupData = {
      email: (step1.email || "").trim(),
      password: step1.password || "",
      full_name,
      first_name: (step1.firstName || "").trim() || null,
      last_name: (step1.lastName || "").trim() || null,
      phone: (step1.phoneNumber || "").replace(/\D/g, "").slice(0, 10) || step1.phoneNumber,
      address,
      notification_cities,
      job_title: (step2.professionalTitle || "").trim(),
      metadata,
      office_locations: office_locations.filter((loc: { name: string; city: string }) => loc.name && loc.city),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(CREATE_ACCOUNT_DRAFT_KEY);
        } catch (_) {}
      }
      router.replace("/create-account/success");
      return;
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-8 pt-1 pb-1">
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
      <div className="max-w-[1000px] mx-auto px-8 pt-0 pb-8 flex-1 w-full">
        <h1 className="text-3xl mb-1">Create an account</h1>

        {/* Progress Indicator - Step 3 of 3 */}
        <div className="mb-4">
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

        <h2 className="text-xl font-semibold text-black mb-3">Step 3: Profile Bio</h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
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
            disabled={submitting}
            className="w-full bg-black text-white py-4 rounded-md font-medium hover:bg-gray-900 transition-colors mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>

          {/* Log in link */}
          <div className="text-center text-sm mt-8 mb-20">
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
