"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Star } from "lucide-react";

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  const token = searchParams.get("token");
  
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [appointmentData, setAppointmentData] = useState<{
    agentName: string | null;
  } | null>(null);

  useEffect(() => {
    if (!appointmentId || !token) {
      setStatus("error");
      setMessage("Invalid review link. Please check your email.");
      return;
    }

    // Fetch appointment details to show agent name
    async function fetchAppointment() {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          setAppointmentData({
            agentName: data.agent?.full_name || null,
          });
        } else {
          // If appointment not found, show error
          const errorData = await response.json().catch(() => ({}));
          setStatus("error");
          setMessage(errorData.error || "Appointment not found");
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
        setStatus("error");
        setMessage("Failed to load appointment details");
      }
    }

    fetchAppointment();
  }, [appointmentId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setStatus("error");
      setMessage("Please select a rating.");
      return;
    }

    if (!appointmentId || !token) {
      setStatus("error");
      setMessage("Invalid review link.");
      return;
    }

    setSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          token,
          rating,
          reviewText: reviewText.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }

      setStatus("success");
      setMessage("Thank you for your feedback!");
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (!appointmentId || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This review link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
        {appointmentData?.agentName ? (
          <p className="text-gray-600 mb-6">
            How was your appointment with <strong>{appointmentData.agentName}</strong>?
          </p>
        ) : appointmentData === null ? (
          <p className="text-gray-500 mb-6 text-sm">Loading appointment details...</p>
        ) : null}

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 text-lg font-medium mb-2">{message}</p>
            <p className="text-gray-600 text-sm">Redirecting to home page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating === 5 && "Excellent"}
                    {rating === 4 && "Very Good"}
                    {rating === 3 && "Good"}
                    {rating === 2 && "Fair"}
                    {rating === 1 && "Poor"}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Share your experience with this specialist..."
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {reviewText.length}/1000 characters
              </p>
            </div>

            {status === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{message}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !rating}
                className="flex-1 bg-[#0D5C3D] text-white px-6 py-3 rounded hover:bg-[#0A4A30] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}

