"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X, Check, Plus } from "lucide-react";
import { Footer } from "@/app/learn-more-about-starting/components/Footer";

interface OfficeLocation {
  name: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
}

const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

const PROVINCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select province" },
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

type Role =
  | "funeral-planner"
  | "lawyer"
  | "insurance-broker"
  | "financial-advisor"
  | "financial_insurance_agent"
  | "";

const inputClassName =
  "w-full h-11 px-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black";

export default function CreateAccountContinuePage() {
  const router = useRouter();
  const [step1Industry, setStep1Industry] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<Role>("");
  const [businessName, setBusinessName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");

  const [hasTruStage, setHasTruStage] = useState("");
  const [hasLLQP, setHasLLQP] = useState("");
  const [llqpQuebec, setLlqpQuebec] = useState("");
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<OfficeLocation>({
    name: "",
    street_address: "",
    city: "",
    province: "BC",
    postal_code: "",
  });

  const [isLicensed, setIsLicensed] = useState("");
  const [lawSocietyLicenseNumber, setLawSocietyLicenseNumber] = useState("");
  const [lawSocietyName, setLawSocietyName] = useState("");
  const [authorizedProvinces, setAuthorizedProvinces] = useState("");

  const [isLicensedInsurance, setIsLicensedInsurance] = useState("");
  const [licensingProvince, setLicensingProvince] = useState("");
  const [hasMultipleProvinces, setHasMultipleProvinces] = useState("");
  const [additionalProvinces, setAdditionalProvinces] = useState("");

  const [isRegistered, setIsRegistered] = useState("");
  const [regulatoryOrganization, setRegulatoryOrganization] = useState("");
  const [registeredProvinces, setRegisteredProvinces] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("createAccountDraft");
      const draft = raw ? JSON.parse(raw) : null;
      if (!draft?.step1) {
        router.replace("/create-account");
        return;
      }
      const industry = (draft.step1.industry || "").trim();
      if (!industry) {
        router.replace("/create-account");
        return;
      }
      setStep1Industry(industry);
      // Map Step 1 industry to Step 2 role for payload
      const roleMap: Record<string, Role> = {
        funeral_planner: "funeral-planner",
        estate_lawyer: "lawyer",
        financial_advisor: "financial-advisor",
        insurance_broker: "insurance-broker",
        financial_insurance_agent: "financial_insurance_agent",
      };
      setSelectedRole(roleMap[industry] || "");
    } catch {
      router.replace("/create-account");
    }
  }, [mounted, router]);

  const showFuneral = step1Industry === "funeral_planner";
  const showLawyer = step1Industry === "estate_lawyer";
  const showFinancial = step1Industry === "financial_advisor" || step1Industry === "financial_insurance_agent";
  const showInsurance = step1Industry === "insurance_broker" || step1Industry === "financial_insurance_agent";

  const removeOfficeLocation = (index: number) => {
    setOfficeLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const addOfficeLocation = () => {
    if (!newLocation.name.trim() || !newLocation.city.trim() || !newLocation.province) {
      setError("Please fill in at least office name, city, and province.");
      return;
    }
    setError(null);
    setOfficeLocations((prev) => [...prev, { ...newLocation }]);
    setNewLocation({
      name: "",
      street_address: "",
      city: "",
      province: "BC",
      postal_code: "",
    });
    setShowAddLocation(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!step1Industry || !selectedRole) {
      setError("Please complete Step 1 and select your industry.");
      return;
    }

    const hasOfficeLocations = showFuneral || showLawyer || showInsurance || showFinancial;
    if (hasOfficeLocations && officeLocations.length === 0) {
      setError("Please add at least one office location.");
      return;
    }

    if (showFuneral) {
      if (!hasTruStage || !hasLLQP || !llqpQuebec) {
        setError("Please answer all questions for your role.");
        return;
      }
    }
    if (showLawyer) {
      if (!isLicensed || !lawSocietyLicenseNumber.trim() || !lawSocietyName.trim() || !authorizedProvinces) {
        setError("Please complete all fields for your role.");
        return;
      }
    }
    if (showInsurance) {
      if (!isLicensedInsurance || !licensingProvince.trim()) {
        setError("Please complete all fields for your role.");
        return;
      }
    }
    if (showFinancial) {
      if (!isRegistered || !regulatoryOrganization.trim() || !registeredProvinces.trim()) {
        setError("Please complete all fields for your role.");
        return;
      }
    }

    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("createAccountDraft") : null;
      const draft = raw ? JSON.parse(raw) : { step1: {} };
      const step2 = {
        step1Industry,
        selectedRole,
        businessName,
        professionalTitle,
        hasTruStage,
        hasLLQP,
        llqpQuebec,
        officeLocations,
        isLicensed,
        lawSocietyLicenseNumber,
        lawSocietyName,
        authorizedProvinces,
        isLicensedInsurance,
        licensingProvince,
        hasMultipleProvinces,
        additionalProvinces,
        isRegistered,
        regulatoryOrganization,
        registeredProvinces,
      };
      sessionStorage.setItem("createAccountDraft", JSON.stringify({ ...draft, step2 }));
    } catch (_) {}
    router.push("/create-account/continue/next");
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Logo - compact so title block sits higher */}
      <div className="mb-0 px-8 pt-2 pb-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={96}
            height={96}
            className="h-16 w-16 object-contain"
          />
          <span className="font-semibold text-black">Soradin</span>
        </Link>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 pt-2 -mt-2 pb-4 flex-1 w-full">
        <h1 className="text-2xl mb-1 text-black">Create an account</h1>
        <p className="text-gray-600 text-sm mb-2">Please complete all steps to submit your account for approval</p>

        {/* Progress: Step 2 active */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-neutral-700" />
            <div className="flex items-center gap-2 text-neutral-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700 text-white text-sm font-medium">2</div>
              <span className="font-medium">Business Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-sm font-medium">3</div>
              <span className="font-medium">Profile Bio</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-black mb-3">Step 2: Business Information</h2>

        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm text-gray-700">
              Business/ Firm Name <span className="text-red-600">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          {/* Professional Title */}
          <div className="space-y-2">
            <label htmlFor="professionalTitle" className="text-sm text-gray-700">
              Professional Title <span className="text-red-600">*</span>
            </label>
            <input
              id="professionalTitle"
              type="text"
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          {/* Funeral Planner */}
          {showFuneral && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Do you have a valid TruStage Life of Canada enrolee number? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasTruStage"
                        value={v}
                        checked={hasTruStage === v}
                        onChange={(e) => setHasTruStage(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFuneral}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Do you have a valid LLQP license? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasLLQP"
                        value={v}
                        checked={hasLLQP === v}
                        onChange={(e) => setHasLLQP(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFuneral}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Is your LLQP valid in Quebec? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no", "non-applicable"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="llqpQuebec"
                        value={v}
                        checked={llqpQuebec === v}
                        onChange={(e) => setLlqpQuebec(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFuneral}
                      />
                      <span className="text-sm text-gray-700">
                        {v === "non-applicable" ? "Non Applicable" : v.charAt(0).toUpperCase() + v.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                {showAddLocation && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address"
                      className={inputClassName}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className={inputClassName}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={addOfficeLocation} className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddLocation(false);
                          setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "" });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      <div className="text-sm text-gray-600">
                        {loc.street_address && `${loc.street_address}, `}
                        {loc.city}, {loc.province} {loc.postal_code}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeOfficeLocation(index)} className="p-1 text-gray-500 hover:text-red-600 shrink-0" aria-label="Remove location">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Lawyer */}
          {showLawyer && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you currently licensed and in good standing with your provincial law society? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isLicensed"
                        value={v}
                        checked={isLicensed === v}
                        onChange={(e) => setIsLicensed(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showLawyer}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="lawSocietyLicenseNumber" className="text-sm text-gray-700">
                  License / member number please. <span className="text-red-600">*</span>
                </label>
                <input
                  id="lawSocietyLicenseNumber"
                  type="text"
                  value={lawSocietyLicenseNumber}
                  onChange={(e) => setLawSocietyLicenseNumber(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. member or license number"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lawSocietyName" className="text-sm text-gray-700">
                  Law society name <span className="text-red-600">*</span>
                </label>
                <input
                  id="lawSocietyName"
                  type="text"
                  value={lawSocietyName}
                  onChange={(e) => setLawSocietyName(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="authorizedProvinces" className="text-sm text-gray-700">
                  Province(s) you are authorized to practice in <span className="text-red-600">*</span>
                </label>
                <select
                  id="authorizedProvinces"
                  value={authorizedProvinces}
                  onChange={(e) => setAuthorizedProvinces(e.target.value)}
                  className={inputClassName}
                  required
                >
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p.value || "placeholder"} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                {showAddLocation && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address"
                      className={inputClassName}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className={inputClassName}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={addOfficeLocation} className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddLocation(false);
                          setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "" });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      <div className="text-sm text-gray-600">
                        {loc.street_address && `${loc.street_address}, `}
                        {loc.city}, {loc.province} {loc.postal_code}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeOfficeLocation(index)} className="p-1 text-gray-500 hover:text-red-600 shrink-0" aria-label="Remove location">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Insurance Broker */}
          {showInsurance && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you a licensed life insurance agent in Canada? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isLicensedInsurance"
                        value={v}
                        checked={isLicensedInsurance === v}
                        onChange={(e) => setIsLicensedInsurance(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showInsurance}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="licensingProvince" className="text-sm text-gray-700">
                  Licensing province <span className="text-red-600">*</span>
                </label>
                <input
                  id="licensingProvince"
                  type="text"
                  value={licensingProvince}
                  onChange={(e) => setLicensingProvince(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you licensed in multiple provinces? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasMultipleProvinces"
                        value={v}
                        checked={hasMultipleProvinces === v}
                        onChange={(e) => setHasMultipleProvinces(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showInsurance}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              {hasMultipleProvinces === "yes" && (
                <div className="space-y-2">
                  <label htmlFor="additionalProvinces" className="text-sm text-gray-700">
                    Additional provinces
                  </label>
                  <input
                    id="additionalProvinces"
                    type="text"
                    value={additionalProvinces}
                    onChange={(e) => setAdditionalProvinces(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              )}
              <div className="space-y-3 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                {showAddLocation && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address"
                      className={inputClassName}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className={inputClassName}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={addOfficeLocation} className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddLocation(false);
                          setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "" });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      <div className="text-sm text-gray-600">
                        {loc.street_address && `${loc.street_address}, `}
                        {loc.city}, {loc.province} {loc.postal_code}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeOfficeLocation(index)} className="p-1 text-gray-500 hover:text-red-600 shrink-0" aria-label="Remove location">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Financial Advisor */}
          {showFinancial && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you registered with a regulatory organization? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isRegistered"
                        value={v}
                        checked={isRegistered === v}
                        onChange={(e) => setIsRegistered(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFinancial}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="regulatoryOrganization" className="text-sm text-gray-700">
                  Regulatory organization <span className="text-red-600">*</span>
                </label>
                <input
                  id="regulatoryOrganization"
                  type="text"
                  value={regulatoryOrganization}
                  onChange={(e) => setRegulatoryOrganization(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="registeredProvinces" className="text-sm text-gray-700">
                  Province(s) you are registered in <span className="text-red-600">*</span>
                </label>
                <input
                  id="registeredProvinces"
                  type="text"
                  value={registeredProvinces}
                  onChange={(e) => setRegisteredProvinces(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-3 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                {showAddLocation && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address"
                      className={inputClassName}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code"
                        className={inputClassName}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={addOfficeLocation} className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddLocation(false);
                          setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "" });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      <div className="text-sm text-gray-600">
                        {loc.street_address && `${loc.street_address}, `}
                        {loc.city}, {loc.province} {loc.postal_code}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeOfficeLocation(index)} className="p-1 text-gray-500 hover:text-red-600 shrink-0" aria-label="Remove location">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Continue button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-md transition-colors mt-4"
          >
            Continue
          </button>
        </form>

        <div className="text-center mt-8 mb-20">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/agent" className="text-black underline hover:no-underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
