"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Lock } from "lucide-react";

function BookingStep1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get time slot data from URL
  const agentId = searchParams.get("agentId") || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";
  const searchedCity = searchParams.get("city") || "";
  const officeLocationName = searchParams.get("officeLocation") || "";

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    // Auto-format date of birth with slashes
    if (field === "dateOfBirth") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      
      // Format with slashes: mm/dd/yyyy
      let formatted = "";
      if (digitsOnly.length > 0) {
        formatted = digitsOnly.substring(0, 2);
      }
      if (digitsOnly.length > 2) {
        formatted += "/" + digitsOnly.substring(2, 4);
      }
      if (digitsOnly.length > 4) {
        formatted += "/" + digitsOnly.substring(4, 8);
      }
      
      // Limit to 10 characters (mm/dd/yyyy)
      if (formatted.length > 10) {
        formatted = formatted.substring(0, 10);
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

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        errors.dateOfBirth = "Please enter date in mm/dd/yyyy format";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // Navigate to step2 with form data in URL params
    const params = new URLSearchParams({
      agentId,
      startsAt,
      endsAt,
      date,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      ...(searchedCity ? { city: searchedCity } : {}),
      ...(officeLocationName ? { officeLocation: officeLocationName } : {}),
    });

    router.push(`/book/step2?${params.toString()}`);
  };

  if (!agentId || !startsAt || !date) {
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
            Tell us a bit about you
          </h1>
          <p className="text-gray-600 mb-8">
            To book your appointment, we need to confirm a few details.
          </p>

          <div className="space-y-6 mb-8">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
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

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                  formErrors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="John"
              />
              {formErrors.firstName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                  formErrors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Doe"
              />
              {formErrors.lastName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  required
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
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-green-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-900 transition-colors"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}

export default function BookingStep1Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <BookingStep1Content />
    </Suspense>
  );
}

