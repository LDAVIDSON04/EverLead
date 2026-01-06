"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";

function BookingStep3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get all data from URL params
  const agentId = searchParams.get("agentId") || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";
  const email = searchParams.get("email") || "";
  const legalFirstName = searchParams.get("legalFirstName") || "";
  const legalLastName = searchParams.get("legalLastName") || "";
  const dateOfBirth = searchParams.get("dateOfBirth") || "";
  const phone = searchParams.get("phone") || "";
  const city = searchParams.get("city") || "";
  const serviceType = searchParams.get("serviceType") || "";
  const searchedCity = searchParams.get("searchedCity") || "";
  const officeLocationName = searchParams.get("officeLocation") || "";
  const officeLocationId = searchParams.get("officeLocationId") || "";
  const rescheduleAppointmentId = searchParams.get("rescheduleAppointmentId") || null;

  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async () => {
    if (!agentId || !startsAt || !email || !legalFirstName || !legalLastName || !phone || !serviceType) {
      setError("Missing required information. Please go back and complete all fields.");
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const res = await fetch("/api/agents/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          startsAt,
          endsAt,
          firstName: legalFirstName,
          lastName: legalLastName,
          email,
          phone: phone.trim(),
          city: city.trim() || searchedCity || null,
          province: null, // Will be inferred from agent
          serviceType,
          notes: `Date of Birth: ${dateOfBirth}`,
          officeLocationId: officeLocationId || null,
          ...(rescheduleAppointmentId ? { rescheduleAppointmentId } : {}),
        }),
      });

      if (res.status === 409) {
        const errorData = await res.json();
        setError(errorData.error || "This time slot is no longer available. Please select another time.");
        setIsBooking(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Booking API error:", errorData);
        throw new Error(errorData.error || errorData.details || "Failed to book appointment");
      }

      const data = await res.json();
      
      // Navigate to success page
      router.push(`/book/success?appointmentId=${data.appointment?.id || ""}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      setError(err.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  if (!agentId || !startsAt || !date || !email || !legalFirstName || !legalLastName || !phone || !serviceType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid booking information</p>
          <Link href="/search" className="text-green-800 hover:underline">
            Return to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">Soradin</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Lock className="w-4 h-4" />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[800px] mx-auto px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Confirm Your Appointment
          </h1>
          <p className="text-gray-600 mb-8">
            Please review your information and confirm your booking.
          </p>

          {/* Review Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Date & Time:</span>{" "}
                <span className="text-gray-900">{date} at {new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Name:</span>{" "}
                <span className="text-gray-900">{legalFirstName} {legalLastName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>{" "}
                <span className="text-gray-900">{email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>{" "}
                <span className="text-gray-900">{phone}</span>
              </div>
              {city && (
                <div>
                  <span className="font-medium text-gray-700">City:</span>{" "}
                  <span className="text-gray-900">{city}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Service Type:</span>{" "}
                <span className="text-gray-900 capitalize">{serviceType}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Book Appointment Button */}
          <button
            onClick={handleBook}
            disabled={isBooking}
            className="w-full bg-green-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function BookingStep3Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <BookingStep3Content />
    </Suspense>
  );
}

