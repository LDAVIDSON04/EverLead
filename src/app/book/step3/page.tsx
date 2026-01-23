"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Calendar, MapPin, Star, Info } from "lucide-react";
import { DateTime } from "luxon";
import { createClient } from "@supabase/supabase-js";
import { formatTimeWithTimezone } from "@/lib/utils";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const searchedCity = searchParams.get("searchedCity") || "";
  const officeLocationName = searchParams.get("officeLocation") || "";
  const officeLocationId = searchParams.get("officeLocationId") || "";
  const rescheduleAppointmentId = searchParams.get("rescheduleAppointmentId") || null;
  const mode = searchParams.get("mode") || "in-person"; // "in-person" | "video"

  const [formData, setFormData] = useState({
    phone: "",
  });
  const [selectedService, setSelectedService] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [selectedOfficeLocation, setSelectedOfficeLocation] = useState<string>("");

  // Fetch agent info and office locations
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

        if (error) throw error;
        setAgentInfo(data);

        // Load office locations and find the matching one
        const { data: officeLocations } = await supabaseClient
          .from("office_locations")
          .select("id, name, city, street_address, province, postal_code")
          .eq("agent_id", agentId)
          .order("city", { ascending: true });

        if (officeLocations && officeLocations.length > 0) {
          // Normalize location names for matching
          const normalizeLocation = (loc: string | null | undefined): string => {
            if (!loc) return '';
            let normalized = loc.split(',').map(s => s.trim())[0];
            normalized = normalized.replace(/\s+office$/i, '').trim();
            return normalized.toLowerCase();
          };

          let matchingLocation: any = null;
          
          // If we have officeLocationId, use that
          if (officeLocationId) {
            matchingLocation = officeLocations.find((loc: any) => loc.id === officeLocationId);
          }
          
          // If we have officeLocationName, try to match by name or city
          if (!matchingLocation && officeLocationName) {
            const normalizedOfficeName = normalizeLocation(officeLocationName);
            matchingLocation = officeLocations.find((loc: any) => {
              const normalizedName = normalizeLocation(loc.name);
              const normalizedCity = normalizeLocation(loc.city);
              return normalizedName === normalizedOfficeName || normalizedCity === normalizedOfficeName;
            });
          }
          
          // If no match yet and we have searchedCity, try to match by city
          if (!matchingLocation && searchedCity) {
            const normalizedSearchedCity = normalizeLocation(searchedCity);
            matchingLocation = officeLocations.find((loc: any) => 
              normalizeLocation(loc.city) === normalizedSearchedCity
            );
          }
          
          // Fallback to first location if no match
          if (!matchingLocation) {
            matchingLocation = officeLocations[0];
          }
          
          if (matchingLocation) {
            // Set display name with full street address
            const locationDisplay = matchingLocation.street_address 
              ? `${matchingLocation.street_address}, ${matchingLocation.city}, ${matchingLocation.province}${matchingLocation.postal_code ? ` ${matchingLocation.postal_code}` : ''}`
              : (matchingLocation.name || `${matchingLocation.city}, ${matchingLocation.province}`);
            setSelectedOfficeLocation(locationDisplay);
          }
        }
      } catch (err) {
        console.error("Error loading agent:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgent();
  }, [agentId, officeLocationId, officeLocationName]);

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
    
    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (agentInfo?.agent_province) {
      const province = agentInfo.agent_province.toUpperCase();
      if (province === "BC" || province === "BRITISH COLUMBIA") {
        timezone = "America/Vancouver";
      } else if (province === "AB" || province === "ALBERTA") {
        timezone = "America/Edmonton";
      } else if (province === "SK" || province === "SASKATCHEWAN") {
        timezone = "America/Regina";
      } else if (province === "MB" || province === "MANITOBA") {
        timezone = "America/Winnipeg";
      } else if (province === "ON" || province === "ONTARIO") {
        timezone = "America/Toronto";
      } else if (province === "QC" || province === "QUEBEC") {
        timezone = "America/Montreal";
      }
    }
    
    return formatTimeWithTimezone(isoString, timezone);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      // Auto-format phone number
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 10) {
        let formatted = cleaned;
        if (cleaned.length >= 6) {
          formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length >= 3) {
          formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        }
        setFormData((prev) => ({ ...prev, [field]: formatted }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      errors.phone = "Telephone number is required";
    }

    if (!selectedService) {
      errors.service = "Please select a service type";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setError(null);
    if (formErrors.service) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.service;
        return newErrors;
      });
    }
  };

  const handleBook = async () => {
    if (!validateForm()) {
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
          phone: formData.phone.trim(),
          city: searchedCity || agentInfo?.agent_city || null,
          province: agentInfo?.agent_province || null,
          serviceType: selectedService,
          notes: `Date of Birth: ${dateOfBirth}`,
          officeLocationId: officeLocationId || null,
          appointmentType: mode, // "in-person" | "video"
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!agentId || !startsAt || !date || !email || !legalFirstName || !legalLastName) {
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
        {/* Agent Card */}
        {agentInfo && (
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
                  {selectedOfficeLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOfficeLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Tell us a bit about you
          </h1>
          <p className="text-gray-600 mb-8">
            To book your appointment, we need to confirm a few things for {agentInfo?.full_name || "the agent"}.
          </p>

          <div className="space-y-6 mb-8">
            {/* Telephone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telephone number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                  formErrors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="(555) 123-4567"
                maxLength={14}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              What type of arrangement are you looking for? <span className="text-red-500">*</span>
            </h2>
            <p className="text-gray-600 mb-4">
              Help us understand your needs so we can better prepare for your appointment.
            </p>

            <div className="space-y-4">
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
            {formErrors.service && (
              <p className="text-sm text-red-500 mt-2">{formErrors.service}</p>
            )}
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
