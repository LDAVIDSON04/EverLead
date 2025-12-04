// src/app/get-started/page.tsx
"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type FormState = "idle" | "submitting" | "success" | "error";

export default function GetStartedPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [planningFor, setPlanningFor] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  // Lock scrolling to prevent skipping steps
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Validate current step before proceeding
  function validateStep(step: number): boolean {
    if (!formRef.current) return false;

    const formData = new FormData(formRef.current);

    if (step === 1) {
      const planning_for = formData.get("planning_for");
      const service_type = formData.get("service_type");
      const remains_disposition = formData.get("remains_disposition");
      const family_pre_arranged = formData.get("family_pre_arranged");

      if (!planning_for || !service_type || !remains_disposition || !family_pre_arranged) {
        setError("Please fill in all required fields.");
        return false;
      }

      // Validate planning_for conditional fields
      if (planning_for === "spouse_partner" || planning_for === "parent" || planning_for === "other_family") {
        const planning_for_name = formData.get("planning_for_name");
        const planning_for_age = formData.get("planning_for_age");
        if (!planning_for_name || !planning_for_age) {
          setError("Please fill in the name and age of the person you're planning for.");
          return false;
        }
      }
    } else if (step === 2) {
      const service_celebration = formData.get("service_celebration");
      const timeline_intent = formData.get("timeline_intent");
      if (!service_celebration || !timeline_intent) {
        setError("Please fill in all required fields.");
        return false;
      }
    } else if (step === 3) {
      const first_name = formData.get("first_name");
      const last_name = formData.get("last_name");
      const email = formData.get("email");
      const phone = formData.get("phone");
      const city = formData.get("city");
      const province = formData.get("province");

      if (!first_name || !last_name || !email || !phone || !city || !province) {
        setError("Please fill in all required fields.");
        return false;
      }

      // Validate email format
      const emailValue = (email as string)?.trim() || "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }

    setError(null);
    return true;
  }

  function handleNextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => {
        const next = Math.min(prev + 1, 3);
        setMaxStepReached((prevMax) => Math.max(prevMax, next));
        return next;
      });
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    setError(null);

    // Validate all steps before final submit to avoid API 400s
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        setFormState("error");
        return;
      }
    }

    const formData = new FormData(e.currentTarget);

    const timeline_intent = (formData.get("timeline_intent") as string) || "";

    let urgency_level: "hot" | "warm" | "cold" = "cold";
    if (timeline_intent === "ready_now") urgency_level = "hot";
    else if (timeline_intent === "speak_with_family" || timeline_intent === "collecting_info_need_done") urgency_level = "warm";

    // Simple default pricing logic for MVP
    const buy_now_price_cents =
      urgency_level === "hot" ? 100 : urgency_level === "warm" ? 100 : null;
    const auction_min_price_cents =
      urgency_level === "hot" ? 50 : urgency_level === "warm" ? 50 : null;

    // Get form values
    const additionalNotesValue = formData.get("additional_notes");
    const additionalNotes = typeof additionalNotesValue === "string" ? additionalNotesValue.trim() : "";

    const planningForValue = (formData.get("planning_for") as string)?.trim() || null;
    const planningForName = (formData.get("planning_for_name") as string)?.trim() || null;
    const planningForAgeValue = formData.get("planning_for_age");
    const planningForAgeStr = planningForAgeValue ? String(planningForAgeValue).trim() : "";
    const planningForAgeParsed = planningForAgeStr ? Number(planningForAgeStr) : null;

    // Build the insert payload
    const leadData: any = {
      first_name: (formData.get("first_name") as string)?.trim() || null,
      last_name: (formData.get("last_name") as string)?.trim() || null,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      city: (formData.get("city") as string)?.trim() || null,
      province: (formData.get("province") as string)?.trim() || null,
      planning_for: planningForValue,
      planning_for_name: planningForName,
      planning_for_age: planningForAgeParsed,
      service_type: (formData.get("service_type") as string)?.trim() || null,
      remains_disposition: (formData.get("remains_disposition") as string)?.trim() || null,
      service_celebration: (formData.get("service_celebration") as string)?.trim() || null,
      family_pre_arranged: (formData.get("family_pre_arranged") as string)?.trim() || null,
      timeline_intent: timeline_intent.trim(),
      urgency_level,
      additional_notes: additionalNotes || null,
      status: urgency_level === "cold" ? "cold_unassigned" : "new",
      buy_now_price_cents,
      auction_min_price_cents,
    };

    const insertPayload = {
      ...leadData,
      full_name: `${leadData.first_name} ${leadData.last_name}`.trim(),
    };

    // Clean payload
    const cleanPayload: any = {};
    for (const [key, value] of Object.entries(insertPayload)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanPayload[key] = value;
      }
    }

    if (!cleanPayload.full_name && leadData.first_name && leadData.last_name) {
      cleanPayload.full_name = `${leadData.first_name} ${leadData.last_name}`.trim();
    }

    console.log("Submitting lead with payload:", cleanPayload);

    try {
      const response = await fetch("/api/leads/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanPayload),
      });

      const responseText = await response.text();
      let responseBody: any = null;
      try {
        responseBody = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse error JSON", e);
        responseBody = { error: "Failed to parse server response", raw: responseText };
      }

      if (!response.ok) {
        console.error("Questionnaire submit failed", {
          status: response.status,
          statusText: response.statusText,
          body: responseBody,
        });
        if (responseBody?.error) {
          setError(responseBody.error);
        } else {
          setError("Something went wrong submitting your information. Please check all fields and try again.");
        }
        setFormState("error");
        return;
      }

      if (!responseBody?.success) {
        console.error("API returned success=false", responseBody);
        setError("Something went wrong submitting your information. Please check all fields and try again.");
        setFormState("error");
        return;
      }

      console.log("Lead submitted successfully:", responseBody.lead);
      
      const leadId = responseBody?.lead?.id;
      if (leadId) {
        router.push(`/book/${leadId}`);
        return;
      }
      
      setFormState("success");
    } catch (fetchError: any) {
      console.error("Network error submitting questionnaire", fetchError);
      setError("Network error. Please check your connection and try again.");
      setFormState("error");
      return;
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
              specialist may contact you to discuss options that match what
              you&apos;ve shared.
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
    <main className="min-h-screen bg-[#f7f4ef] overflow-hidden">
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
              <span className="text-xl font-light tracking-wide text-white">
                Soradin
              </span>
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
      
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-16 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
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

        {/* Progress Indicator (clickable steps for back/forward navigation) */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (step <= maxStepReached) {
                  setCurrentStep(step);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
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
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* STEP 1: Intent only */}
            <div className={currentStep === 1 ? "space-y-4" : "space-y-4 hidden"}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                  Who are you planning for? *
                </label>
                <select
                  name="planning_for"
                  required
                  value={planningFor}
                  onChange={(e) => setPlanningFor(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="myself">Myself</option>
                  <option value="spouse_partner">Spouse / Partner</option>
                  <option value="parent">Parent</option>
                  <option value="other_family">Other family member</option>
                </select>

                {/* Conditional fields for spouse/partner, parent, or other family */}
                {(planningFor === "spouse_partner" ||
                  planningFor === "parent" ||
                  planningFor === "other_family") && (
                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                        Name of the person you're planning for *
                      </label>
                      <input
                        name="planning_for_name"
                        required
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                        placeholder="Enter their full name"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                        Age of the person you're planning for *
                      </label>
                      <input
                        type="number"
                        name="planning_for_age"
                        min={0}
                        max={120}
                        required
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
                  name="service_type"
                  required
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
                  name="remains_disposition"
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="scatter_cremated_remains">
                    Scatter cremated remains
                  </option>
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
                  name="family_pre_arranged"
                  required
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

            {/* STEP 2: Preferences & timing */}
            <div className={currentStep === 2 ? "space-y-4" : "space-y-4 hidden"}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                  Would you want a memorial or celebration of life? *
                </label>
                <select
                  name="service_celebration"
                  required
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
                  name="timeline_intent"
                  required
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="ready_now">I&apos;m ready to plan soon</option>
                  <option value="speak_with_family">
                    I need to speak with my family first
                  </option>
                  <option value="collecting_info_need_done">
                    I&apos;m gathering information right now
                  </option>
                  <option value="collecting_info_unsure">
                    I&apos;m planning for the future
                  </option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                  Anything you&apos;d like us to know? (optional)
                </label>
                <textarea
                  name="additional_notes"
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

            {/* STEP 3: Contact info */}
            <div className={currentStep === 3 ? "space-y-4" : "space-y-4 hidden"}>
              <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      First name *
                    </label>
                    <input
                      name="first_name"
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Last name *
                    </label>
                    <input
                      name="last_name"
                      required
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
                    name="email"
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Phone *
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      City *
                    </label>
                    <input
                      name="city"
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Province / State *
                    </label>
                    <input
                      name="province"
                      defaultValue="BC"
                      required
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
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
