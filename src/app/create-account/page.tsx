"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Info } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

const INDUSTRIES = [
  { value: "", label: "Select your industry" },
  { value: "funeral_planner", label: "Funeral Planner" },
  { value: "estate_lawyer", label: "Estate Lawyer" },
  { value: "financial_advisor", label: "Financial Advisor" },
  { value: "insurance_broker", label: "Insurance Broker" },
];

const PROVINCES = [
  { value: "", label: "Province" },
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    industry: "",
    homeAddress: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      // Only restore draft when user is coming back from the continue step (e.g. clicked Back).
      // If they landed here from the main nav / another page, show a blank form.
      const referrer = document.referrer || "";
      const fromContinue = referrer.includes("/create-account/continue");
      if (!fromContinue) {
        sessionStorage.removeItem("createAccountDraft");
        return;
      }
      const raw = sessionStorage.getItem("createAccountDraft");
      const draft = raw ? JSON.parse(raw) : null;
      const step1 = draft?.step1;
      if (step1 && typeof step1 === "object") {
        setFormData({
          firstName: step1.firstName ?? "",
          lastName: step1.lastName ?? "",
          email: step1.email ?? "",
          phoneNumber: step1.phoneNumber ?? "",
          password: step1.password ?? "",
          confirmPassword: step1.confirmPassword ?? "",
          industry: step1.industry ?? "",
          homeAddress: step1.homeAddress ?? "",
          city: step1.city ?? "",
          province: step1.province ?? "",
          postalCode: step1.postalCode ?? "",
        });
      }
    } catch (_) {}
  }, [mounted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    const draft = { step1: formData };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("createAccountDraft", JSON.stringify(draft));
      } catch (_) {}
    }
    router.push("/create-account/continue");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with logo - compact so title block sits higher */}
      <div className="px-6 pt-2 pb-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={96}
            height={96}
            className="h-16 w-16 object-contain"
          />
          <span className="font-semibold text-black text-lg">Soradin</span>
        </Link>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 pt-2 -mt-2">
        <h1 className="text-3xl font-normal text-gray-900 mb-1">
          Create an account
        </h1>
        <p className="text-gray-600 text-sm mb-2">Please complete all steps to submit your account for approval</p>

        {/* Progress: Step 1 active */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white text-sm font-medium">1</div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-sm font-medium">2</div>
              <span className="font-medium">Business Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-sm font-medium">3</div>
              <span className="font-medium">Profile Bio</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-black mb-3">Step 1: Basic Information</h2>

        {passwordError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {passwordError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="flex items-center gap-1 text-sm text-gray-700 mb-2"
              >
                Legal first name <span className="text-red-600">*</span>
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="flex items-center gap-1 text-sm text-gray-700 mb-2"
              >
                Legal last name <span className="text-red-600">*</span>
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-gray-700 mb-2"
              >
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm text-gray-700 mb-2"
              >
                Phone number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(XXX) XXX-XXXX"
                maxLength={14}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-2"
              >
                Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-gray-700 mb-2"
              >
                Confirm password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Industry */}
          <div>
            <label
              htmlFor="industry"
              className="block text-sm text-gray-700 mb-2"
            >
              Select your industry <span className="text-red-600">*</span>
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.25rem 1.25rem", paddingRight: "2.25rem" }}
            >
              {INDUSTRIES.map((opt) => (
                <option key={opt.value || "placeholder"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Home address */}
          <div>
            <label
              htmlFor="homeAddress"
              className="block text-sm text-gray-700 mb-2"
            >
              Home address <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="homeAddress"
              name="homeAddress"
              value={formData.homeAddress}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            />
          </div>

          {/* City, Province, Postal code */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-sm text-gray-700 mb-2"
              >
                City <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="province"
                className="block text-sm text-gray-700 mb-2"
              >
                Province <span className="text-red-600">*</span>
              </label>
              <select
                id="province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              >
                {PROVINCES.map((p) => (
                  <option key={p.value || "placeholder"} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm text-gray-700 mb-2"
              >
                Postal code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Continue button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Continue
          </button>

          {/* Log in link */}
          <div className="text-center text-sm text-gray-700 mt-4 mb-8">
            Already have an account?{" "}
            <Link
              href="/agent"
              className="text-black underline hover:text-gray-700"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
