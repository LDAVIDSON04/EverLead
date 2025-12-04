// src/app/get-started/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type FormState = "idle" | "submitting" | "success" | "error";

type Step = 1 | 2 | 3;

type FormDataShape = {
  planning_for: string;
  planning_for_name: string;
  planning_for_age: string;
  service_type: string;
  remains_disposition: string;
  family_pre_arranged: string;
  service_celebration: string;
  timeline_intent: string;
  additional_notes: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
};

const initialForm: FormDataShape = {
  planning_for: "",
  planning_for_name: "",
  planning_for_age: "",
  service_type: "",
  remains_disposition: "",
  family_pre_arranged: "",
  service_celebration: "",
  timeline_intent: "",
  additional_notes: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  province: "BC",
};

export default function GetStartedPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [maxStepReached, setMaxStepReached] = useState<Step>(1);
  const [form, setForm] = useState<FormDataShape>(initialForm);

  // Lock scrolling to keep focus on the flow
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function updateField<K extends keyof FormDataShape>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(step: Step): boolean {
    // Clear old error first
    setError(null);

    if (step === 1) {
      const required = [
        "planning_for",
        "service_type",
        "remains_disposition",
        "family_pre_arranged",
      ] as const;

      for (const key of required) {
        if (!form[key] || form[key].trim() === "") {
          setError("Please fill in all required fields.");
          return false;
        }
      }

      if (
        form.planning_for === "spouse_partner" ||
        form.planning_for === "parent" ||
        form.planning_for === "other_family"
      ) {
        if (!form.planning_for_name.trim() || !form.planning_for_age.trim()) {
          setError("Please fill in the name and age of the person you're planning for.");
          return false;
        }
      }
    }

    if (step === 2) {
      const required = ["service_celebration", "timeline_intent"] as const;
      for (const key of required) {
        if (!form[key] || form[key].trim() === "") {
          setError("Please fill in all required fields.");
          return false;
        }
      }
    }

    if (step === 3) {
      const required = ["first_name", "last_name", "email", "phone", "city", "province"] as const;
      for (const key of required) {
        if (!form[key] || form[key].trim() === "") {
          setError("Please fill in all required fields.");
          return false;
        }
      }

      const emailValue = form.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }

    return true;
  }

  function goToStep(step: Step) {
    if (step <= maxStepReached) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleNextStep() {
    if (!validateStep(currentStep)) return;
    const next = (currentStep + 1) as Step;
    setCurrentStep(next);
    setMaxStepReached((prev) => (next > prev ? next : prev));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setError(null);

    // Validate all steps before sending to API
    for (const step of [1, 2, 3] as Step[]) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        setFormState("error");
        return;
      }
    }

    // Derive urgency from timeline_intent
    let urgency_level: "hot" | "warm" | "cold" = "cold";
    if (form.timeline_intent === "ready_now") urgency_level = "hot";
    else if (
      form.timeline_intent === "speak_with_family" ||
      form.timeline_intent === "collecting_info_need_done"
    )
      urgency_level = "warm";

    const buy_now_price_cents =
      urgency_level === "hot" ? 100 : urgency_level === "warm" ? 100 : null;
    const auction_min_price_cents =
      urgency_level === "hot" ? 50 : urgency_level === "warm" ? 50 : null;

    const payload: any = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      planning_for: form.planning_for || null,
      planning_for_name: form.planning_for_name || null,
      planning_for_age: form.planning_for_age ? Number(form.planning_for_age) : null,
      service_type: form.service_type || null,
      remains_disposition: form.remains_disposition || null,
      family_pre_arranged: form.family_pre_arranged || null,
      service_celebration: form.service_celebration || null,
      timeline_intent: form.timeline_intent.trim(),
      urgency_level,
      additional_notes: form.additional_notes || null,
      status: urgency_level === "cold" ? "cold_unassigned" : "new",
      buy_now_price_cents,
      auction_min_price_cents,
    };

    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: "Failed to parse server response", raw: text };
      }

      if (!res.ok || !body?.success) {
        setError(body?.error || "Something went wrong submitting your information.");
        setFormState("error");
        return;
      }

      const leadId = body?.lead?.id;
      if (leadId) {
        router.push(`/book/${leadId}`);
        return;
      }

      setFormState("success");
    } catch (err: any) {
      setError("Network error. Please check your connection and try again.");
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-xl border border-[#ded3c2] bg-white p-8 shadow-sm">
            <h1
              className="mb-4 text-3xl font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Thank you.
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-[#4a4a4a]">
              We&apos;ve received your information. A licensed pre-arrangement
              specialist will reach out to help guide you through your options.
            </p>
            <Link
              href="/"
              className="inline-block rounded-md bg-[#2a2a2a] px-5 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Header with Logo */}
      <header className="bg-[#1f2933]/95 backdrop-blur-sm text-white border-b border-[#1f2933]/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo - white.png"
              alt="Soradin"
              width={70}
              height={70}
              className="object-contain"
            />
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-light tracking-wide text-white">Soradin</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#e0d5bf]/80 font-light">
                PRE-PLANNING
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-[#e0d5bf]/80 hover:text-white transition-colors font-light tracking-wide"
          >
            Back to home
          </Link>
        </div>
      </header>

      <div
        className="mx-auto max-w-4xl px-6 py-12 md:py-16 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 80px)" }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1
            className="mb-3 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Tell us a little about your wishes
          </h1>
          <p className="text-base leading-relaxed text-[#4a4a4a]">
            This helps us match you with a licensed local specialist.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => goToStep(step as Step)}
              disabled={step > maxStepReached}
              className={`h-2 w-16 rounded-full transition-colors ${
                currentStep === step
                  ? "bg-[#2a2a2a]"
                  : step <= maxStepReached
                  ? "bg-slate-500"
                  : "bg-slate-300"
              }`}
              aria-label={`Go to step ${step}`}
            />
          ))}
        </div>
        <div className="mb-6 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-[#ded3c2] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Who are you planning for? *
                  </label>
                  <select
                    value={form.planning_for}
                    onChange={(e) => updateField("planning_for", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="myself">Myself</option>
                    <option value="spouse_partner">Spouse / Partner</option>
                    <option value="parent">Parent</option>
                    <option value="other_family">Other family member</option>
                  </select>

                  {(form.planning_for === "spouse_partner" ||
                    form.planning_for === "parent" ||
                    form.planning_for === "other_family") && (
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                          Name of the person you&apos;re planning for *
                        </label>
                        <input
                          value={form.planning_for_name}
                          onChange={(e) => updateField("planning_for_name", e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                          placeholder="Enter their full name"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                          Age of the person you&apos;re planning for *
                        </label>
                        <input
                          type="number"
                          value={form.planning_for_age}
                          onChange={(e) => updateField("planning_for_age", e.target.value)}
                          min={0}
                          max={120}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                          placeholder="Enter their age"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    What type of service would you like to explore? *
                  </label>
                  <select
                    value={form.service_type}
                    onChange={(e) => updateField("service_type", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="cremation">Cremation</option>
                    <option value="burial">Burial</option>
                    <option value="unsure">Unsure</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Burial or cremation? *
                  </label>
                  <select
                    value={form.remains_disposition}
                    onChange={(e) => updateField("remains_disposition", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="scatter_cremated_remains">Scatter cremated remains</option>
                    <option value="keep_remains">Keep remains</option>
                    <option value="burial_at_cemetery">Burial at cemetery</option>
                    <option value="unsure">Unsure</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Has anyone close to you planned before? *
                  </label>
                  <select
                    value={form.family_pre_arranged}
                    onChange={(e) => updateField("family_pre_arranged", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Unsure</option>
                  </select>
                </div>

                {/* Trust text */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="space-y-1.5 text-xs text-[#5a5a5a]">
                    <p className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>No obligation</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Takes under 60 seconds</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Your information is never sold</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>You&apos;ll speak with a real local specialist</span>
                    </p>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Would you want a memorial or celebration of life? *
                  </label>
                  <select
                    value={form.service_celebration}
                    onChange={(e) => updateField("service_celebration", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Unsure</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    When would you like to learn more about your options? *
                  </label>
                  <select
                    value={form.timeline_intent}
                    onChange={(e) => updateField("timeline_intent", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="ready_now">I&apos;m ready to plan soon</option>
                    <option value="speak_with_family">I need to speak with my family first</option>
                    <option value="collecting_info_need_done">
                      I&apos;m gathering information right now
                    </option>
                    <option value="collecting_info_unsure">I&apos;m planning for the future</option>
                    <option value="unsure">Not sure yet</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Anything you&apos;d like us to know? (optional)
                  </label>
                  <textarea
                    value={form.additional_notes}
                    onChange={(e) => updateField("additional_notes", e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    placeholder="Preferences, concerns, religious considerations, family wishes, or anything else you'd like us to be aware of."
                  />
                </div>

                {/* Continue Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      First name *
                    </label>
                    <input
                      value={form.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Last name *
                    </label>
                    <input
                      value={form.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Phone *
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      City *
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Province / State *
                    </label>
                    <input
                      value={form.province}
                      onChange={(e) => updateField("province", e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Final CTA Button */}
                <div className="flex flex-col items-end pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="w-full rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors md:w-auto"
                  >
                    {formState === "submitting" ? "Submitting..." : "Get matched with a specialist"}
                  </button>
                  <p className="text-xs text-[#5a5a5a] text-center md:text-right max-w-md">
                    A licensed local specialist will reach out to guide you through your options.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}


