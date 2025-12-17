"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function BookingStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data from Step 1
  const agentId = searchParams.get("agentId") || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";
  const email = searchParams.get("email") || "";
  const legalFirstName = searchParams.get("legalFirstName") || "";
  const legalLastName = searchParams.get("legalLastName") || "";
  const dateOfBirth = searchParams.get("dateOfBirth") || "";
  const sex = searchParams.get("sex") || "";

  const [agentInfo, setAgentInfo] = useState<{
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    job_title: string | null;
    agent_city: string | null;
    agent_province: string | null;
  } | null>(null);

  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent info
  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();

        if (error) {
          console.error("Error loading agent:", error);
        } else if (data) {
          setAgentInfo(data);
        }
      } catch (err) {
        console.error("Error loading agent:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAgent();
  }, [agentId]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (isoString: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setError(null);
  };

  const handleBook = async () => {
    if (!selectedService) {
      setError("Please select a service type");
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      // Convert date of birth from mm/dd/yyyy to ISO format for storage
      let dobISO = null;
      if (dateOfBirth) {
        const [month, day, year] = dateOfBirth.split("/");
        if (month && day && year) {
          dobISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }

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
          phone: "", // Will be collected in future steps if needed
          city: agentInfo?.agent_city || null,
          province: agentInfo?.agent_province || null,
          serviceType: selectedService,
          notes: `Date of Birth: ${dateOfBirth}, Sex: ${sex}`,
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
        throw new Error(errorData.error || "Failed to book appointment");
      }

      const data = await res.json();
      
      // Navigate to success page or show success message
      router.push(`/book/success?appointmentId=${data.appointment?.id || ""}&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      setError(err.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!agentInfo || !startsAt || !date) {
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
                <span className="w-4 h-4 rounded-full border-2 border-green-800 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-green-800"></span>
                </span>
                <span>Secure</span>
              </div>
              <Link
                href="/search"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[800px] mx-auto px-4 py-8">
        {/* Booking Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            {agentInfo.profile_picture_url ? (
              <img
                src={agentInfo.profile_picture_url}
                alt={agentInfo.full_name || "Agent"}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl">
                  {agentInfo.first_name?.[0]?.toUpperCase() || agentInfo.full_name?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {agentInfo.full_name || (agentInfo.first_name && agentInfo.last_name 
                  ? `${agentInfo.first_name} ${agentInfo.last_name}`
                  : "Pre-need Specialist")}
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                {agentInfo.job_title || "Pre-need Planning Specialist"}
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(date)}, {formatTime(startsAt)}
                  </span>
                </div>
                {agentInfo.agent_city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {agentInfo.agent_city}
                      {agentInfo.agent_province && `, ${agentInfo.agent_province}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            What service are you looking for?
          </h1>
          <p className="text-gray-600 mb-8">
            Help us understand your needs so we can better prepare for your appointment.
          </p>

          <div className="space-y-4 mb-8">
            {/* Service Options */}
            <label
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedService === "cremation"
                  ? "border-green-800 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="service"
                value="cremation"
                checked={selectedService === "cremation"}
                onChange={() => handleServiceSelect("cremation")}
                className="w-5 h-5 text-green-800 focus:ring-green-800"
              />
              <span className="text-gray-900 font-medium">Cremation</span>
            </label>

            <label
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedService === "burial"
                  ? "border-green-800 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="service"
                value="burial"
                checked={selectedService === "burial"}
                onChange={() => handleServiceSelect("burial")}
                className="w-5 h-5 text-green-800 focus:ring-green-800"
              />
              <span className="text-gray-900 font-medium">Burial</span>
            </label>

            <label
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedService === "unsure"
                  ? "border-green-800 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="service"
                value="unsure"
                checked={selectedService === "unsure"}
                onChange={() => handleServiceSelect("unsure")}
                className="w-5 h-5 text-green-800 focus:ring-green-800"
              />
              <span className="text-gray-900 font-medium">Unsure</span>
            </label>
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
            disabled={isBooking || !selectedService}
            className="w-full bg-green-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </main>
    </div>
  );
}
