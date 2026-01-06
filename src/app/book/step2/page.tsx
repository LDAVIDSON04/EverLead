"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Calendar, ArrowLeft, Info, Lock } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { DateTime } from "luxon";

function BookingStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get time slot data from URL
  const agentId = searchParams.get("agentId") || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";
  const searchedCity = searchParams.get("city") || ""; // City from search (e.g., Penticton)
  const officeLocationName = searchParams.get("officeLocation") || ""; // Office location name
  const rescheduleAppointmentId = searchParams.get("rescheduleAppointmentId") || null; // ID of appointment being rescheduled
  
  // Get Step 1 data from URL params
  const step1Email = searchParams.get("email") || "";
  const step1FirstName = searchParams.get("firstName") || "";
  const step1LastName = searchParams.get("lastName") || "";
  const step1DateOfBirth = searchParams.get("dateOfBirth") || "";

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

  // Form data (Step 2 only - phone and service type)
  const [formData, setFormData] = useState({
    phone: "",
  });

  const [selectedOfficeLocation, setSelectedOfficeLocation] = useState<string>("");
  const [officeLocationId, setOfficeLocationId] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        if (error) {
          console.error("Error loading agent:", error);
        } else if (data) {
          setAgentInfo(data);
        }

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
          
          // If we have officeLocationName, try to match by name or city
          if (officeLocationName) {
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
            // Store the office_location_id
            setOfficeLocationId(matchingLocation.id);
            
            // Set display name
            const locationDisplay = matchingLocation.name || 
              (matchingLocation.street_address 
                ? `${matchingLocation.street_address}, ${matchingLocation.city}, ${matchingLocation.province}${matchingLocation.postal_code ? ` ${matchingLocation.postal_code}` : ''}`
                : `${matchingLocation.city}, ${matchingLocation.province}`);
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
  }, [agentId, searchedCity, officeLocationName]);

  // City field should be empty - let family fill it in

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
    
    // Get agent's timezone - infer from agent_province or use browser default
    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // If we have agent info, try to infer timezone from province
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
    
    // Use luxon to properly convert UTC to agent's local timezone
    const utcDate = DateTime.fromISO(isoString, { zone: "utc" });
    const localDate = utcDate.setZone(timezone);
    
    // Format in 12-hour format
    const hours = localDate.hour;
    const minutes = localDate.minute;
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  const handleInputChange = (field: string, value: string) => {
    // Auto-format phone number: (XXX) XXX-XXXX
    if (field === "phone") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      
      // Format with brackets and dash: (XXX) XXX-XXXX
      let formatted = "";
      if (digitsOnly.length > 0) {
        formatted = "(" + digitsOnly.substring(0, 3);
      }
      if (digitsOnly.length >= 3) {
        formatted += ")";
      }
      if (digitsOnly.length > 3) {
        formatted += " " + digitsOnly.substring(3, 6);
      }
      if (digitsOnly.length > 6) {
        formatted += "-" + digitsOnly.substring(6, 10);
      }
      
      // Limit to 14 characters (XXX) XXX-XXXX
      if (formatted.length > 14) {
        formatted = formatted.substring(0, 14);
      }
      
      value = formatted;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Step 1 data from URL params
    if (!step1Email.trim()) {
      errors.step1 = "Missing email. Please go back and complete Step 1.";
    }
    if (!step1FirstName.trim()) {
      errors.step1 = "Missing first name. Please go back and complete Step 1.";
    }
    if (!step1LastName.trim()) {
      errors.step1 = "Missing last name. Please go back and complete Step 1.";
    }
    if (!step1DateOfBirth.trim()) {
      errors.step1 = "Missing date of birth. Please go back and complete Step 1.";
    }

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
          firstName: step1FirstName,
          lastName: step1LastName,
          email: step1Email,
          phone: formData.phone.trim(),
          city: searchedCity || agentInfo?.agent_city || null,
          province: agentInfo?.agent_province || null,
          serviceType: selectedService,
          notes: `Date of Birth: ${step1DateOfBirth}`,
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
      
      // Navigate to success page or show success message
      router.push(`/book/success?appointmentId=${data.appointment?.id || ""}&email=${encodeURIComponent(step1Email)}`);
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
                <Lock className="w-4 h-4" />
                <span>Secure</span>
              </div>
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

        {/* Form Section */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Tell us a bit about you
          </h1>
          <p className="text-gray-600 mb-8">
            To book your appointment, we need to confirm a few things for {agentInfo?.full_name || (agentInfo?.first_name && agentInfo?.last_name ? `${agentInfo.first_name} ${agentInfo.last_name}` : "the agent")}.
          </p>

          {/* Confirm Office Location */}
          {selectedOfficeLocation && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Location
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-800" />
                  <span className="text-gray-900">{selectedOfficeLocation}</span>
                </div>
              </div>
            </div>
          )}

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
          
          {/* Step 1 validation error */}
          {formErrors.step1 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formErrors.step1}</p>
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

export default function BookingStep2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <BookingStep2Content />
    </Suspense>
  );
}
