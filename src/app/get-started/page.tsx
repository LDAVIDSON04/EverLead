// src/app/get-started/page.tsx
"use client";

import { FormEvent, useState } from "react";
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

    const { error: insertError } = await supabaseClient.from("leads").insert({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      province: formData.get("province"),
      postal_code: formData.get("postal_code"),
      age_range: formData.get("age_range"),
      planning_for: formData.get("planning_for"),
      service_type: formData.get("service_type"),
      ceremony_preferences: formData.get("ceremony_preferences"),
      budget_range: formData.get("budget_range"),
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
      <div style={{ maxWidth: "640px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
          Thank you.
        </h1>
        <p style={{ color: "#4B5563", marginBottom: "12px" }}>
          We've received your information. A licensed pre-arrangement specialist
          may contact you to discuss options that match what you've shared.
        </p>
        <a href="/" style={{ color: "#2563EB", fontSize: "14px" }}>
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        Tell us a bit about your plans.
      </h1>
      <p style={{ color: "#4B5563", fontSize: "14px", marginBottom: "16px" }}>
        This helps us connect you with the right specialist. There's no
        obligation to purchase anything.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label style={{ fontSize: "14px" }}>
          Full name
          <input
            name="full_name"
            required
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Email
          <input
            type="email"
            name="email"
            required
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Phone
          <input
            name="phone"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          City
          <input
            name="city"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Province / State
          <input
            name="province"
            defaultValue="BC"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Postal code
          <input
            name="postal_code"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Age range
          <select
            name="age_range"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          >
            <option value="">Select...</option>
            <option value="under_40">Under 40</option>
            <option value="40_55">40–55</option>
            <option value="56_70">56–70</option>
            <option value="71_plus">71+</option>
          </select>
        </label>

        <label style={{ fontSize: "14px" }}>
          Who are you planning for?
          <select
            name="planning_for"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          >
            <option value="">Select...</option>
            <option value="myself">Myself</option>
            <option value="spouse_partner">Spouse / Partner</option>
            <option value="parent">Parent</option>
            <option value="other_family">Other family member</option>
          </select>
        </label>

        <label style={{ fontSize: "14px" }}>
          Service type
          <select
            name="service_type"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          >
            <option value="">Not sure / need guidance</option>
            <option value="cremation">Cremation</option>
            <option value="burial">Burial</option>
          </select>
        </label>

        <label style={{ fontSize: "14px" }}>
          Budget range (approximate)
          <select
            name="budget_range"
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          >
            <option value="">Select...</option>
            <option value="0_3000">$0–$3,000</option>
            <option value="3000_6000">$3,000–$6,000</option>
            <option value="6000_10000">$6,000–$10,000</option>
            <option value="10000_plus">$10,000+</option>
          </select>
        </label>

        <label style={{ fontSize: "14px" }}>
          When are you hoping to make a decision?
          <select
            name="timeline_intent"
            required
            style={{ display: "block", marginTop: "4px", width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #E5E7EB" }}
          >
            <option value="">Select...</option>
            <option value="purchase_now">
              I'm ready to purchase a plan now
            </option>
            <option value="talk_to_someone">
              I want to talk to someone and think about it
            </option>
            <option value="just_browsing">I'm just browsing / not sure</option>
          </select>
        </label>

        <label style={{ fontSize: "14px" }}>
          Anything else you'd like us to know?
          <textarea
            name="additional_notes"
            rows={3}
            style={{
              display: "block",
              marginTop: "4px",
              width: "100%",
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid #E5E7EB",
            }}
          />
        </label>

        {error && (
          <p style={{ color: "#DC2626", fontSize: "14px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={formState === "submitting"}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            background: "#2563EB",
            color: "white",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {formState === "submitting" ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

