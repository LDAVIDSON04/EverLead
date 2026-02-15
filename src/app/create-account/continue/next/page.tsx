"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, RefreshCw } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

const CREATE_ACCOUNT_DRAFT_KEY = "createAccountDraft";

export default function CreateAccountNextPage() {
  const router = useRouter();
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [howYouHelp, setHowYouHelp] = useState("");
  const [whatFamiliesAppreciate, setWhatFamiliesAppreciate] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hasAnsweredAccurately, setHasAnsweredAccurately] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

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
        return;
      }
      if (draft?.step3) {
        const s = draft.step3;
        if (s.yearsOfExperience != null) setYearsOfExperience(String(s.yearsOfExperience));
        if (s.howYouHelp != null) setHowYouHelp(String(s.howYouHelp));
        if (s.whatFamiliesAppreciate != null) setWhatFamiliesAppreciate(String(s.whatFamiliesAppreciate));
        if (s.profileBio != null) setProfileBio(String(s.profileBio));
        setSaved(true);
      }
    } catch {
      router.replace("/create-account");
    }
  }, [mounted, router]);

  const handleSaveBio = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(CREATE_ACCOUNT_DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : { step1: null, step2: null };
      draft.step3 = {
        yearsOfExperience,
        howYouHelp,
        whatFamiliesAppreciate,
        profileBio,
      };
      sessionStorage.setItem(CREATE_ACCOUNT_DRAFT_KEY, JSON.stringify(draft));
      setSaved(true);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (_) {}
  };

  const handleGenerateBio = async () => {
    setError(null);
    if (!yearsOfExperience || !howYouHelp.trim() || !whatFamiliesAppreciate.trim()) {
      setError("Please fill in years of experience and both questions before generating.");
      return;
    }
    let draft: { step1?: any; step2?: any } = {};
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(CREATE_ACCOUNT_DRAFT_KEY) : null;
      if (!raw) {
        setError("Session expired. Please start from step 1.");
        return;
      }
      draft = JSON.parse(raw);
    } catch {
      setError("Session expired. Please start from step 1.");
      return;
    }
    const step1 = draft.step1;
    const step2 = draft.step2;
    const fullName = [step1?.firstName, step1?.lastName].filter(Boolean).join(" ").trim();
    const location = step1?.city && step1?.province ? `${step1.city}, ${step1.province}` : (step1?.city || step1?.province || "");
    const businessName = step2?.selectedRole === "funeral-planner" && Array.isArray(step2?.businessNames)
      ? step2.businessNames.map((n: string) => (n || "").trim()).filter(Boolean).join(", ")
      : (step2?.businessName || "").trim();
    setGenerating(true);
    try {
      const res = await fetch("/api/agents/generate-bio-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearsOfExperience: String(yearsOfExperience).trim(),
          practicePhilosophyHelp: howYouHelp.trim(),
          practicePhilosophyAppreciate: whatFamiliesAppreciate.trim(),
          fullName: fullName || undefined,
          jobTitle: (step2?.professionalTitle || "").trim() || undefined,
          businessName: businessName || undefined,
          location: location || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to generate bio. Please try again.");
        return;
      }
      if (data.bio) {
        setProfileBio(data.bio);
      }
    } catch {
      setError("Failed to generate bio. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profileBio.trim()) {
      setError("Please write your profile bio.");
      return;
    }
    if (!hasAnsweredAccurately) {
      setError("Please confirm you have answered accurately.");
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
      "financial_insurance_agent": "Financial & Insurance advisor",
    };

    const metadata: Record<string, unknown> = {
      agent_role: step2.selectedRole || "",
      specialty: step2.selectedRole ? (specialtyFromRole[step2.selectedRole] ?? "Funeral Planner") : "",
      business_name: step2.selectedRole === "funeral-planner" && Array.isArray(step2.businessNames)
        ? step2.businessNames.map((n: string) => (n || "").trim()).filter(Boolean).join(", ")
        : (step2.businessName || "").trim(),
      bio: {
        years_of_experience: String(yearsOfExperience).trim(),
        practice_philosophy_help: howYouHelp.trim(),
        practice_philosophy_appreciate: whatFamiliesAppreciate.trim(),
      },
    };

    if (step2.selectedRole === "funeral-planner") {
      if (Array.isArray(step2.businessNames)) {
        metadata.business_names = step2.businessNames.map((n: string) => (n || "").trim()).filter(Boolean);
      }
      metadata.licensed_or_employed_funeral = step2.licensedOrEmployedFuneral === "yes";
      metadata.regulator_name = (step2.regulatorName || "").trim();
      metadata.pre_need_purple_shield = step2.preNeedPurpleShield === true;
      metadata.pre_need_trustage = step2.preNeedTrustage === true;
      metadata.pre_need_funeral_plans_canada = step2.preNeedFuneralPlansCanada === true;
      metadata.pre_need_other = step2.preNeedOther === true;
      metadata.pre_need_other_specify = (step2.preNeedOtherSpecify || "").trim();
    }
    if (step2.selectedRole === "lawyer") {
      metadata.law_society_license_number = step2.lawSocietyLicenseNumber || "";
      metadata.law_society_name = step2.lawSocietyName || "";
      metadata.authorized_provinces = step2.authorizedProvinces || "";
    }
    if (step2.selectedRole === "insurance-broker" || step2.selectedRole === "financial_insurance_agent") {
      metadata.licensed_in_canada = step2.isLicensedInsurance === "yes";
      metadata.license_number = step2.insuranceLicenseNumber || "";
      metadata.regulatory_body = step2.regulatoryBody || "";
      metadata.brokerage_mga = step2.brokerageMga || "";
      metadata.eo_coverage = step2.eoCoverageInsurance === "yes";
    }
    if (step2.selectedRole === "financial-advisor" || step2.selectedRole === "financial_insurance_agent") {
      metadata.regulatory_organization = step2.regulatoryOrganization || "";
      metadata.license_registration_number = step2.registrationLicenseNumber || "";
      metadata.registered_provinces = step2.registeredProvinces || "";
      metadata.eo_insurance_confirmed = step2.eoInsuranceConfirmed === true;
    }

    const office_locations = Array.isArray(step2.officeLocations)
      ? step2.officeLocations.map((loc: { name?: string; street_address?: string; city?: string; province?: string; postal_code?: string; associated_firm?: string }) => ({
          name: loc.name || "",
          street_address: loc.street_address || null,
          city: loc.city || "",
          province: loc.province || "",
          postal_code: loc.postal_code || null,
          associated_firm: loc.associated_firm || null,
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
      profile_bio: profileBio.trim(),
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
      {/* Header - compact so title block sits higher */}
      <div className="px-8 pt-2 pb-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={96}
            height={96}
            className="h-16 w-16 object-contain"
          />
          <span className="font-semibold text-black">Soradin</span>
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-[1000px] mx-auto px-8 pt-2 -mt-2 pb-8 flex-1 w-full">
        <h1 className="text-3xl mb-1">Create an account</h1>

        {/* Progress Indicator - Step 3 of 3 */}
        <div className="mb-10">
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

        <h2 className="text-xl font-semibold text-gray-900 mb-1">Step 3: Profile Bio</h2>
        <p className="text-gray-500 text-sm mb-6">Answer the questions below, generate your bio, then edit if you like. What you save is what appears on your profile.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Questions card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">About you</h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Years of experience <span className="text-red-500">*</span>
                </label>
                <input
                  id="years"
                  type="text"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g. 5 or 5 years"
                />
              </div>
              <div>
                <label htmlFor="help" className="block text-sm font-medium text-gray-700 mb-1.5">
                  How do you typically help families? (200 chars max) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="help"
                  value={howYouHelp}
                  onChange={(e) => { if (e.target.value.length <= 200) setHowYouHelp(e.target.value); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  rows={2}
                  maxLength={200}
                  placeholder="Describe your approach to helping families…"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{howYouHelp.length}/200</p>
              </div>
              <div>
                <label htmlFor="appreciate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  What do families appreciate most about your approach? (200 chars max) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="appreciate"
                  value={whatFamiliesAppreciate}
                  onChange={(e) => { if (e.target.value.length <= 200) setWhatFamiliesAppreciate(e.target.value); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  rows={2}
                  maxLength={200}
                  placeholder="What families value about working with you…"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{whatFamiliesAppreciate.length}/200</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateBio}
              disabled={generating || !yearsOfExperience || !howYouHelp.trim() || !whatFamiliesAppreciate.trim()}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Bio
                </>
              )}
            </button>
          </div>

          {/* Bio preview / editable box */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 shadow-sm">
            <label htmlFor="profile-bio" className="block text-sm font-semibold text-gray-900 mb-2">
              Your profile bio <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Generated text appears here. Edit it if you like—what you see here is what gets saved to your profile and &quot;Learn more about you&quot;.</p>
            <textarea
              id="profile-bio"
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y min-h-[200px] text-sm leading-relaxed"
              rows={8}
              placeholder="Click “Generate Bio” above, or write your own."
              required
            />
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveBio}
                className="w-fit px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                {saved ? "Saved" : "Save"}
              </button>
              {showSaveSuccess && (
                <p className="text-sm font-medium text-green-600">
                  The bio has been successfully saved.
                </p>
              )}
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <span className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 mt-0.5 transition-colors ${hasAnsweredAccurately ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"}`}>
                <input
                  id="accurate"
                  type="checkbox"
                  checked={hasAnsweredAccurately}
                  onChange={(e) => setHasAnsweredAccurately(e.target.checked)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  required
                />
                {hasAnsweredAccurately && (
                  <Check className="h-3 w-3 text-white stroke-[3]" strokeWidth={3} />
                )}
              </span>
              <span className="text-sm text-gray-700 select-none">
                I have entered all info accurately <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          {!saved && (
            <p className="text-sm text-amber-700">Save your bio above before submitting.</p>
          )}
          <button
            type="submit"
            disabled={submitting || !saved}
            className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>

          <div className="text-center text-sm text-gray-500 pt-2 pb-20">
            Already have an account?{" "}
            <Link href="/agent" className="text-gray-900 underline hover:no-underline">
              Log in
            </Link>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
