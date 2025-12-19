"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Calendar, ArrowLeft, Info } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

function BookingStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get time slot data from URL
  const agentId = searchParams.get("agentId") || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";

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

  // Form data (previously from Step 1)
  const [formData, setFormData] = useState({
    email: "",
    legalFirstName: "",
    legalLastName: "",
    dateOfBirth: "",
    sex: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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

  const handleInputChange = (field: string, value: string) => {
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

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (!formData.legalFirstName.trim()) {
      errors.legalFirstName = "Legal first name is required";
    }

    if (!formData.legalLastName.trim()) {
      errors.legalLastName = "Legal last name is required";
    }

    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        errors.dateOfBirth = "Please enter date in mm/dd/yyyy format";
      }
    }

    if (!formData.sex) {
      errors.sex = "Please select your sex";
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
          firstName: formData.legalFirstName,
          lastName: formData.legalLastName,
          email: formData.email,
          phone: null, // Optional for now
          city: agentInfo?.agent_city || null,
          province: agentInfo?.agent_province || null,
          serviceType: selectedService,
          notes: `Date of Birth: ${formData.dateOfBirth}, Sex: ${formData.sex}`,
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
      router.push(`/book/success?appointmentId=${data.appointment?.id || ""}&email=${encodeURIComponent(formData.email)}`);
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Tell us a bit about you
          </h1>
          <p className="text-gray-600 mb-8">
            To book your appointment, we need to verify a few things for {agentInfo?.full_name || "the agent"}'s office.
          </p>

          <div className="space-y-6 mb-8">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="your.email@example.com"
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Legal First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="legalFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    Legal first name
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </label>
                <input
                  type="text"
                  id="legalFirstName"
                  name="legalFirstName"
                  value={formData.legalFirstName}
                  onChange={(e) => handleInputChange("legalFirstName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    formErrors.legalFirstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="John"
                />
                {formErrors.legalFirstName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.legalFirstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="legalLastName" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    Legal last name
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </label>
                <input
                  type="text"
                  id="legalLastName"
                  name="legalLastName"
                  value={formData.legalLastName}
                  onChange={(e) => handleInputChange("legalLastName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    formErrors.legalLastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Doe"
                />
                {formErrors.legalLastName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.legalLastName}</p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    formErrors.dateOfBirth ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="mm/dd/yyyy"
                  maxLength={10}
                />
              </div>
              {formErrors.dateOfBirth && (
                <p className="text-sm text-red-500 mt-1">{formErrors.dateOfBirth}</p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1">
                  Sex
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    id="sex-male"
                    name="sex"
                    value="male"
                    checked={formData.sex === "male"}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    className="w-4 h-4 text-green-800 focus:ring-green-800"
                  />
                  <span className="text-gray-700">Male</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    id="sex-female"
                    name="sex"
                    value="female"
                    checked={formData.sex === "female"}
                    onChange={(e) => handleInputChange("sex", e.target.value)}
                    className="w-4 h-4 text-green-800 focus:ring-green-800"
                  />
                  <span className="text-gray-700">Female</span>
                </label>
              </div>
              {formErrors.sex && (
                <p className="text-sm text-red-500 mt-1">{formErrors.sex}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              What service are you looking for?
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
