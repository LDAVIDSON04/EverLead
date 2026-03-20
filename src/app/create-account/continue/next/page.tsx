"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, RefreshCw, Loader2, X } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

const CREATE_ACCOUNT_DRAFT_KEY = "createAccountDraft";

export default function CreateAccountNextPage() {
  const router = useRouter();
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [howYouHelp, setHowYouHelp] = useState("");
  const [whatFamiliesAppreciate, setWhatFamiliesAppreciate] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [generating, setGenerating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

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
    } catch (_) {}
  };

  // Require Save before Submit: clear saved when user edits any bio-related field
  const markUnsaved = () => setSaved(false);

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
        setSaved(false);
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
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions.");
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
      "insurance-broker": "Insurance Agent",
      "financial-advisor": "Financial Planner",
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
      metadata.minimum_portfolio_size = step2.minimumPortfolioSize || "";
      metadata.eo_insurance_confirmed = step2.eoInsuranceConfirmed === true;
    }
    if (step2.selectedRole === "financial-advisor") {
      metadata.qualified_insurance_products = step2.qualifiedInsuranceProducts === "yes";
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
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Submitting overlay - prevents freeze feeling, clear feedback */}
      {submitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm cursor-wait"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-5 max-w-sm mx-4">
            <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-gray-900 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-gray-900 animate-spin" />
            </div>
            <p className="text-gray-800 font-medium text-center">
              Submitting for approval…
            </p>
            <p className="text-gray-500 text-sm text-center">
              This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}

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
                  onChange={(e) => { setYearsOfExperience(e.target.value); markUnsaved(); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter years of experience"
                />
              </div>
              <div>
                <label htmlFor="help" className="block text-sm font-medium text-gray-700 mb-1.5">
                  How do you typically help families? (200 chars max) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="help"
                  value={howYouHelp}
                  onChange={(e) => { if (e.target.value.length <= 200) { setHowYouHelp(e.target.value); markUnsaved(); } }}
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
                  onChange={(e) => { if (e.target.value.length <= 200) { setWhatFamiliesAppreciate(e.target.value); markUnsaved(); } }}
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
              onChange={(e) => { setProfileBio(e.target.value); markUnsaved(); }}
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
              {saved && (
                <p className="text-sm font-medium text-green-600">
                  The bio has been successfully saved.
                </p>
              )}
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <span className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 mt-0.5 transition-colors ${agreedToTerms ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"}`}>
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    required
                  />
                  {agreedToTerms && (
                    <Check className="h-3 w-3 text-white stroke-[3]" strokeWidth={3} />
                  )}
                </span>
                <span className="text-sm text-black select-none">
                  I agree to terms and conditions <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
            <p className="text-sm text-black">
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 rounded"
              >
                Terms and Conditions
              </button>
            </p>
          </div>

          {!saved && (
            <p className="text-sm text-amber-700">Save your bio above before submitting.</p>
          )}
          <button
            type="submit"
            disabled={submitting || !saved}
            className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                Submitting for approval…
              </>
            ) : (
              "Submit for approval"
            )}
          </button>

          <div className="text-center text-sm text-gray-500 pt-2 pb-20">
            Already have an account?{" "}
            <Link href="/agent" className="text-gray-900 underline hover:no-underline">
              Log in
            </Link>
          </div>
        </form>
      </div>

      {/* Terms and Conditions modal */}
      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setTermsOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative rounded-2xl bg-white shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-black">Terms and Conditions</h2>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm text-black space-y-4">
              <p className="text-center text-gray-600">Effective Date: January 4, 2026</p>
              <p>
                Welcome to Soradin. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Soradin website, platform, and any related services (collectively, the &quot;Platform&quot;).
              </p>
              <p>
                By accessing or using Soradin, you agree to these Terms. If you do not agree with these Terms, please do not use the Platform.
              </p>
              <section>
                <h3 className="font-semibold text-black mb-2">1. About Soradin</h3>
                <p className="mb-2">Soradin is a technology platform designed to help individuals and families learn about estate planning and connect with professionals who provide related services.</p>
                <p className="mb-2">The Platform allows users to discover information, explore planning options, and schedule meetings with professionals involved in estate planning, including but not limited to:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Estate lawyers</li>
                  <li>Financial advisors</li>
                  <li>Funeral pre-planning professionals</li>
                  <li>Insurance advisors</li>
                </ul>
                <p className="mb-2">Soradin provides educational resources and scheduling tools to facilitate connections between users and professionals.</p>
                <p>Soradin does not provide legal, financial, insurance, funeral, or other professional services. All services are provided directly by the professionals listed on the Platform.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">2. Eligibility</h3>
                <p className="mb-2">To use the Platform, you must be at least 18 years of age.</p>
                <p className="mb-2">By using Soradin, you represent and warrant that:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You are legally capable of entering into these Terms</li>
                  <li>The information you provide is accurate and truthful</li>
                  <li>You will use the Platform in accordance with applicable laws and regulations</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">3. Users and Professionals</h3>
                <p className="mb-2">Soradin may be used by both individuals seeking information or services (&quot;Users&quot;) and professionals offering services (&quot;Professionals&quot;).</p>
                <p className="mb-2">Professionals using the Platform may include lawyers, financial advisors, insurance professionals, funeral planning professionals, or other specialists involved in estate planning.</p>
                <p className="mb-2">Professionals are responsible for ensuring that they:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Hold all required licenses or certifications</li>
                  <li>Comply with applicable laws and professional regulations</li>
                  <li>Provide accurate information about their qualifications and services</li>
                </ul>
                <p>Soradin does not independently verify all professional credentials and does not guarantee the quality, legality, or outcome of services provided by professionals.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">4. Professional Independence</h3>
                <p className="mb-2">Professionals listed on the Platform operate independently.</p>
                <p className="mb-2">Professionals are not employees, agents, partners, or representatives of Soradin.</p>
                <p>Any advice, services, or recommendations provided by a professional are solely the responsibility of that professional.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">5. Appointments and Scheduling</h3>
                <p className="mb-2">Soradin allows Users to view professional profiles and schedule appointments with Professionals through the Platform.</p>
                <p className="mb-2">Professionals control their own:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Availability</li>
                  <li>Services offered</li>
                  <li>Appointment scheduling</li>
                </ul>
                <p>Soradin provides the technology that enables scheduling but does not participate in the professional services provided during or after appointments.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">6. Payments</h3>
                <p className="mb-2">Some services offered by Professionals may involve fees.</p>
                <p className="mb-2">Where payments are processed through the Platform:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Payments may be handled by third-party payment processors such as Stripe</li>
                  <li>Soradin does not store full payment card information</li>
                  <li>Pricing and refund policies are determined by the Professional providing the service unless otherwise specified</li>
                </ul>
                <p>Soradin is not responsible for disputes between Users and Professionals regarding services provided.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">7. Educational Content</h3>
                <p className="mb-2">Soradin may provide articles, blog posts, guides, or other informational content intended to help users better understand estate planning topics.</p>
                <p className="mb-2">All content provided on the Platform is for informational and educational purposes only and should not be considered legal, financial, insurance, or professional advice.</p>
                <p>Users should consult qualified professionals before making decisions related to estate planning or financial matters.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">8. Professional Content and Blog Contributions</h3>
                <p className="mb-2">Professionals may have the ability to submit articles or educational content for publication on the Platform.</p>
                <p className="mb-2">All submitted content is subject to review and approval by Soradin before publication.</p>
                <p className="mb-2">Content must be educational in nature and relevant to estate planning topics. Soradin may remove or refuse to publish content that:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Is promotional or misleading</li>
                  <li>Violates professional standards</li>
                  <li>Includes inappropriate or unrelated material</li>
                </ul>
                <p>Soradin reserves the right to edit or remove content at its discretion.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">9. Platform Use</h3>
                <p className="mb-2">You agree to use the Platform responsibly and lawfully.</p>
                <p className="mb-2">You may not:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Provide false or misleading information</li>
                  <li>Misrepresent your identity or credentials</li>
                  <li>Attempt to interfere with the Platform&apos;s functionality or security</li>
                  <li>Copy, scrape, or misuse Platform content or data</li>
                  <li>Use the Platform for unlawful, fraudulent, or abusive purposes</li>
                </ul>
                <p>Soradin reserves the right to suspend or terminate access to the Platform if these Terms are violated.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">10. Platform Availability</h3>
                <p className="mb-2">Soradin works to keep the Platform accessible and reliable, but availability cannot be guaranteed.</p>
                <p className="mb-2">The Platform may occasionally experience:</p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>Maintenance or updates</li>
                  <li>Technical interruptions</li>
                  <li>Temporary outages</li>
                </ul>
                <p>Soradin does not guarantee uninterrupted or error-free operation.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">11. Intellectual Property</h3>
                <p className="mb-2">All content, branding, software, and materials associated with Soradin are owned by Soradin Inc. or its licensors.</p>
                <p>You may not copy, reproduce, distribute, modify, or create derivative works from the Platform without prior written permission from Soradin.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">12. Limitation of Liability</h3>
                <p className="mb-2">To the fullest extent permitted by law, Soradin shall not be liable for indirect, incidental, consequential, or special damages arising from the use of the Platform.</p>
                <p>Soradin&apos;s total liability for any claim relating to the Platform shall not exceed the amount paid by you to Soradin, if any, in the twelve months preceding the claim.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">13. Changes to These Terms</h3>
                <p className="mb-2">Soradin may update these Terms as the Platform evolves.</p>
                <p className="mb-2">Updated Terms will be posted on this page with a revised effective date.</p>
                <p>Continued use of the Platform after updates constitutes acceptance of the revised Terms.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">14. Governing Law</h3>
                <p className="mb-2">These Terms are governed by and interpreted in accordance with the laws of the Province of British Columbia and the laws of Canada applicable therein, without regard to conflict of law principles.</p>
                <p>Any disputes arising from these Terms or the use of the Platform shall be subject to the exclusive jurisdiction of the courts located in British Columbia, Canada.</p>
              </section>
              <section>
                <h3 className="font-semibold text-black mb-2">15. Contact</h3>
                <p className="mb-1">If you have questions about these Terms, please contact:</p>
                <p className="mb-1">Email: <a href="mailto:support@soradin.com" className="text-black underline hover:no-underline">support@soradin.com</a></p>
                <p>Company: Soradin Inc.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
