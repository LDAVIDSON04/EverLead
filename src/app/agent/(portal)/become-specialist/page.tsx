"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

type SpecialistStatus = "pending" | "approved" | "rejected" | null;

type Specialist = {
  id: string;
  display_name: string;
  bio: string | null;
  location_city: string | null;
  location_region: string | null;
  timezone: string;
  status: SpecialistStatus;
  is_active: boolean;
  certification_details: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
};

export default function BecomeSpecialistPage() {
  useRequireRole("agent");
  const router = useRouter();

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    location_city: "",
    location_region: "",
    timezone: "America/Edmonton",
    certification_details: "",
  });

  // Fetch specialist record on mount
  useEffect(() => {
    async function fetchSpecialist() {
      try {
        // Get access token from Supabase session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) {
          router.push("/agent");
          return;
        }

        const res = await fetch("/api/specialists/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/agent");
            return;
          }
          throw new Error("Failed to fetch specialist record");
        }

        const data = await res.json();
        if (data) {
          setSpecialist(data);
          // Pre-fill form with existing data
          setFormData({
            display_name: data.display_name || "",
            bio: data.bio || "",
            location_city: data.location_city || "",
            location_region: data.location_region || "",
            timezone: data.timezone || "America/Edmonton",
            certification_details: data.certification_details || "",
          });
        }
      } catch (err: any) {
        console.error("Error fetching specialist:", err);
        setError(err.message || "Failed to load specialist information");
      } finally {
        setLoading(false);
      }
    }

    fetchSpecialist();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      // Get access token from Supabase session
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        setError("You must be logged in to submit an application");
        return;
      }

      const res = await fetch("/api/specialists/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      // Update local state
      setSpecialist(data);
      setSuccessMessage(
        "Your application has been submitted and is pending approval. We'll notify you by email once it's approved."
      );
    } catch (err: any) {
      console.error("Error submitting application:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If approved, show success message
  if (specialist?.status === "approved") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Your specialist account is approved and active.
              </h1>
              <p className="text-gray-600">
                You can now receive bookings and manage your schedule.
              </p>
            </div>
            <Link
              href="/agent/dashboard"
              className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If pending, show pending message with read-only form
  if (specialist?.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Your application is under review
            </h2>
            <p className="text-yellow-700">
              We're reviewing your specialist application. You'll receive an email notification once
              it's been approved.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Specialist Application</h1>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  disabled
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="location_city"
                    value={formData.location_city}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province / State
                  </label>
                  <input
                    type="text"
                    name="location_region"
                    value={formData.location_region}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                >
                  <option value="America/Edmonton">Mountain Time (Edmonton)</option>
                  <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                  <option value="America/Toronto">Eastern Time (Toronto)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification / License Details
                </label>
                <textarea
                  name="certification_details"
                  value={formData.certification_details}
                  disabled
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="Tell us about your certification, license, or credentials..."
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // If rejected, show rejection message with option to resubmit
  if (specialist?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Application Rejected
            </h2>
            {specialist.rejected_reason && (
              <p className="text-red-700 mb-2">
                <strong>Reason:</strong> {specialist.rejected_reason}
              </p>
            )}
            <p className="text-red-700">
              You can update your application and resubmit below.
            </p>
          </div>

          {/* Show the form (same as below) */}
        </div>
      </div>
    );
  }

  // No specialist record - show full form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Become a Specialist</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                placeholder="Your professional name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                placeholder="Tell us about yourself and your experience..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="Calgary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province / State
                </label>
                <input
                  type="text"
                  name="location_region"
                  value={formData.location_region}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="AB"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                <option value="America/Edmonton">Mountain Time (Edmonton)</option>
                <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                <option value="America/Toronto">Eastern Time (Toronto)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification / License Details
              </label>
              <textarea
                name="certification_details"
                value={formData.certification_details}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                placeholder="Tell us about your certification, license, or credentials..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

