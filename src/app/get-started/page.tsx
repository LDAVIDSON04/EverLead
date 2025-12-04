// src/app/get-started/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type FormState = "idle" | "submitting" | "success" | "error";

export default function GetStartedPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [planningFor, setPlanningFor] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    setError(null);

    const formData = new FormData(e.currentTarget);

    const timeline_intent = (formData.get("timeline_intent") as string) || "";

    let urgency_level: "hot" | "warm" | "cold" = "cold";
    if (timeline_intent === "ready_now") urgency_level = "hot";
    else if (timeline_intent === "speak_with_family" || timeline_intent === "collecting_info_need_done") urgency_level = "warm";

    // Simple default pricing logic for MVP
    const buy_now_price_cents =
      urgency_level === "hot" ? 100 : urgency_level === "warm" ? 100 : null; // $1 for testing
    const auction_min_price_cents =
      urgency_level === "hot" ? 50 : urgency_level === "warm" ? 50 : null; // $0.50 for testing

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "timeline_intent",
      "service_type",
      "planning_for",
      "remains_disposition",
      "service_celebration",
      "family_pre_arranged",
    ];

    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(`Please fill in all required fields. Missing: ${field.replace("_", " ")}`);
        setFormState("error");
        return;
      }
    }

    // Validate email format
    const emailValue = (formData.get("email") as string)?.trim() || "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setError("Please enter a valid email address.");
      setFormState("error");
      return;
    }

    // Get form values (optional fields)
    const additionalNotesValue = formData.get("additional_notes");
    const additionalNotes = typeof additionalNotesValue === "string" ? additionalNotesValue.trim() : "";

    // Get planning_for related fields if applicable
    const planningForValue = (formData.get("planning_for") as string)?.trim() || null;
    const planningForName = (formData.get("planning_for_name") as string)?.trim() || null;
    const planningForAgeValue = formData.get("planning_for_age");
    const planningForAgeStr = planningForAgeValue ? String(planningForAgeValue).trim() : "";
    const planningForAgeParsed = planningForAgeStr ? Number(planningForAgeStr) : null;

    // Validate planning_for fields if required
    if (planningForValue && (planningForValue === "spouse_partner" || planningForValue === "parent" || planningForValue === "other_family")) {
      if (!planningForName || planningForName.length === 0) {
        setError("Please enter the name of the person you're planning for.");
        setFormState("error");
        return;
      }
      if (!planningForAgeParsed || isNaN(planningForAgeParsed) || planningForAgeParsed < 0 || planningForAgeParsed > 120) {
        setError("Please enter a valid age (0-120) for the person you're planning for.");
        setFormState("error");
        return;
      }
    }

    // Build the insert payload - ensure types are correct
    const leadData: any = {
      first_name: (formData.get("first_name") as string)?.trim() || null,
      last_name: (formData.get("last_name") as string)?.trim() || null,
      email: emailValue.trim(),
      phone: (formData.get("phone") as string)?.trim() || null, // Optional
      planning_for: planningForValue,
      planning_for_name: planningForName, // Name of person being planned for
      planning_for_age: planningForAgeParsed, // Age of person being planned for
      service_type: (formData.get("service_type") as string)?.trim() || null,
      timeline_intent: timeline_intent.trim(),
      urgency_level,
      remains_disposition: (formData.get("remains_disposition") as string)?.trim() || null,
      service_celebration: (formData.get("service_celebration") as string)?.trim() || null,
      family_pre_arranged: (formData.get("family_pre_arranged") as string)?.trim() || null,
      additional_notes: additionalNotes || null, // Optional
      status: urgency_level === "cold" ? "cold_unassigned" : "new",
      buy_now_price_cents,
      auction_min_price_cents,
    };

    // Always include full_name for backward compatibility
    const insertPayload = {
      ...leadData,
      full_name: `${leadData.first_name} ${leadData.last_name}`.trim(),
    };

    // Clean payload: only include fields that exist, remove null/undefined/empty strings
    const cleanPayload: any = {};
    for (const [key, value] of Object.entries(insertPayload)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanPayload[key] = value;
      }
    }

    // Ensure full_name exists for backward compatibility (even if other fields were filtered)
    if (!cleanPayload.full_name && leadData.first_name && leadData.last_name) {
      cleanPayload.full_name = `${leadData.first_name} ${leadData.last_name}`.trim();
    }

    console.log("Submitting lead with payload:", cleanPayload);

    // Call API route instead of direct Supabase insert (uses service role key)
    try {
      const response = await fetch("/api/leads/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanPayload),
      });

      // Get response text first (can only read once)
      const responseText = await response.text();
      let responseBody: any = null;
      try {
        responseBody = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse error JSON", e);
        console.error("Response text:", responseText);
        responseBody = { error: "Failed to parse server response", raw: responseText };
      }

      if (!response.ok) {
        console.error("Questionnaire submit failed", {
          status: response.status,
          statusText: response.statusText,
          body: responseBody,
        });
        // Log the full error details
        console.error("Full API Error Response:", JSON.stringify(responseBody, null, 2));
        if (responseBody?.details) {
          console.error("API Error Details:", responseBody.details);
        }
        if (responseBody?.code) {
          console.error("API Error Code:", responseBody.code);
        }

        // Show specific error messages from API, including details if available
        if (responseBody?.error) {
          let errorMessage = responseBody.error;
          // Include details in console for debugging, but show user-friendly message
          if (responseBody.details) {
            console.error("Error details:", responseBody.details);
            // For development, show more details
            if (process.env.NODE_ENV === "development") {
              errorMessage = `${responseBody.error}: ${responseBody.details}`;
            }
          }
          setError(errorMessage);
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
      
      // Get the lead ID from the response and redirect to booking page
      const leadId = responseBody?.lead?.id;
      if (leadId) {
        // Redirect to booking page
        console.log("Redirecting to booking page:", `/book/${leadId}`);
        router.push(`/book/${leadId}`);
        return;
      }
      
      console.warn("No lead ID in response, cannot redirect to booking page");
      
      // Fallback: if no lead ID, show success message
      setFormState("success");
    } catch (fetchError: any) {
      console.error("Network error submitting questionnaire", {
        message: fetchError?.message,
        stack: fetchError?.stack,
        fullError: fetchError,
      });
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
      
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        {/* Optional Reassurance Text */}
        <div className="mb-6 text-center">
          <p className="text-base leading-relaxed text-[#4a4a4a] italic">
            Most people who plan ahead say they feel an immediate sense of relief once they understand their options.
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="mb-3 text-3xl font-normal text-[#2a2a2a] md:text-4xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Tell us a little about your wishes
          </h1>
          <p className="text-base leading-relaxed text-[#4a4a4a]">
            This helps us connect you with the right specialist. There&apos;s no
            obligation to purchase anything, and you can save your answers to
            revisit later.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-[#ded3c2] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: About You */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Step 1 of 3
                </span>
              </div>
              <h2
                className="mb-2 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Let&apos;s start with something simple
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[#4a4a4a]">
                This helps us match you with the right pre-planning specialist in your area. There is no obligation to purchase anything.
              </p>
              <div className="space-y-4">
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
                    Phone (optional — only if you&apos;d like a call)
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

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
                  {(planningFor === "spouse_partner" || planningFor === "parent" || planningFor === "other_family") && (
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

                {/* Trust text under Step 1 */}
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

                {/* Continue Button for Step 1 */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Scroll to Step 2
                      const step2 = document.querySelector('[data-step="2"]');
                      step2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Service Preferences */}
            <div className="border-t border-[#ded3c2] pt-8" data-step="2">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Step 2 of 3
                </span>
              </div>
              <h2
                className="mb-2 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Your general preferences
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[#4a4a4a]">
                These answers help us understand what kind of guidance may be helpful for you. You can always change your mind later.
              </p>
              <div className="space-y-4">
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
                    Have you given any thought to burial or cremation? *
                  </label>
                  <select
                    name="remains_disposition"
                    required
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
                    Has anyone close to you ever planned in advance like this? *
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

                {/* Continue Button for Step 2 */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Scroll to Step 3
                      const step3 = document.querySelector('[data-step="3"]');
                      step3?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Timing */}
            <div className="border-t border-[#ded3c2] pt-8" data-step="3">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Step 3 of 3
                </span>
              </div>
              <h2
                className="mb-2 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Next steps
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[#4a4a4a]">
                This lets us understand when and how you&apos;d prefer to be contacted.
              </p>
              <div className="space-y-4">
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
                    <option value="ready_now">
                      I&apos;m ready to plan soon
                    </option>
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
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col items-end border-t border-[#ded3c2] pt-6 space-y-4">
              <button
                type="submit"
                disabled={formState === "submitting"}
                className="w-full rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors md:w-auto"
              >
                {formState === "submitting" ? "Submitting..." : "Get matched with a specialist"}
              </button>
              <p className="text-xs text-[#5a5a5a] text-center md:text-right max-w-md">
                We will never sell your information. A local specialist may reach out to help answer your questions — there is no obligation to move forward.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
