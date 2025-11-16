// src/app/get-started/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

type FormState = "idle" | "submitting" | "success" | "error";

export default function GetStartedPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    setError(null);

    const formData = new FormData(e.currentTarget);

    const timeline_intent = (formData.get("timeline_intent") as string) || "";

    let urgency_level: "hot" | "warm" | "cold" = "cold";
    if (timeline_intent === "purchase_now") urgency_level = "hot";
    else if (timeline_intent === "talk_to_someone") urgency_level = "warm";

    // Simple default pricing logic for MVP
    const buy_now_price_cents =
      urgency_level === "hot" ? 100 : urgency_level === "warm" ? 100 : null; // $1 for testing
    const auction_min_price_cents =
      urgency_level === "hot" ? 50 : urgency_level === "warm" ? 50 : null; // $0.50 for testing

    const ageValue = formData.get("age");
    const age = ageValue ? parseInt(ageValue as string, 10) : null;

    const { error: insertError } = await supabaseClient.from("leads").insert({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      province: formData.get("province"),
      postal_code: formData.get("postal_code"),
      age: age,
      age_range: null, // Keep for backward compatibility, but send null
      planning_for: formData.get("planning_for"),
      service_type: formData.get("service_type"),
      ceremony_preferences: formData.get("ceremony_preferences"),
      budget_range: null, // Removed field, send null
      timeline_intent,
      urgency_level,
      additional_notes: formData.get("additional_notes"),
      status: urgency_level === "cold" ? "cold_unassigned" : "new",
      buy_now_price_cents,
      auction_min_price_cents,
    });

    if (insertError) {
      console.error(insertError);
      setError("Something went wrong. Please try again.");
      setFormState("error");
      return;
    }

    setFormState("success");
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
    <main className="min-h-screen bg-[#f7f4ef] py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
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
                className="mb-4 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                About you
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Full name
                  </label>
                  <input
                    name="full_name"
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Email
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
                    Phone
                  </label>
                  <input
                    name="phone"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Optional, but helpful if a specialist needs to reach you.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      City
                    </label>
                    <input
                      name="city"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Province / State
                    </label>
                    <input
                      name="province"
                      defaultValue="BC"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Postal code
                    </label>
                    <input
                      name="postal_code"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Your Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      min={18}
                      max={120}
                      required
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Who are you planning for?
                    </label>
                    <select
                      name="planning_for"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="myself">Myself</option>
                      <option value="spouse_partner">Spouse / Partner</option>
                      <option value="parent">Parent</option>
                      <option value="other_family">Other family member</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Service Preferences */}
            <div className="border-t border-[#ded3c2] pt-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Step 2 of 3
                </span>
              </div>
              <h2
                className="mb-4 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Service preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Service type
                  </label>
                  <select
                    name="service_type"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Not sure / need guidance</option>
                    <option value="cremation">Cremation</option>
                    <option value="burial">Burial</option>
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    You can always change this later as you learn more.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Timing */}
            <div className="border-t border-[#ded3c2] pt-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Step 3 of 3
                </span>
              </div>
              <h2
                className="mb-4 text-xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Contact &amp; timing
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    When are you hoping to make a decision?
                  </label>
                  <select
                    name="timeline_intent"
                    required
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="purchase_now">
                      I&apos;m ready to purchase a plan now
                    </option>
                    <option value="talk_to_someone">
                      I want to talk to someone and think about it
                    </option>
                    <option value="just_browsing">
                      I&apos;m just browsing / not sure
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Anything else you&apos;d like us to know?
                  </label>
                  <textarea
                    name="additional_notes"
                    rows={4}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    placeholder="Any special considerations, questions, or preferences you'd like to share..."
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
            <div className="flex justify-end border-t border-[#ded3c2] pt-6">
              <button
                type="submit"
                disabled={formState === "submitting"}
                className="w-full rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors md:w-auto"
              >
                {formState === "submitting" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
