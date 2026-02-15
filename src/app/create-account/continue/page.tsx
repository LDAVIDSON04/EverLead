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
  /** For funeral planners: business/firm name associated with this office. */
  associated_firm?: string;
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
  const [businessNames, setBusinessNames] = useState<string[]>([""]); // funeral only: multiple firm names
  const [professionalTitle, setProfessionalTitle] = useState("");

  const [licensedOrEmployedFuneral, setLicensedOrEmployedFuneral] = useState("");
  const [regulatorName, setRegulatorName] = useState("");
  const [preNeedPurpleShield, setPreNeedPurpleShield] = useState(false);
  const [preNeedTrustage, setPreNeedTrustage] = useState(false);
  const [preNeedFuneralPlansCanada, setPreNeedFuneralPlansCanada] = useState(false);
  const [preNeedOther, setPreNeedOther] = useState(false);
  const [preNeedOtherSpecify, setPreNeedOtherSpecify] = useState("");
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<OfficeLocation>({
    name: "",
    street_address: "",
    city: "",
    province: "BC",
    postal_code: "",
    associated_firm: "",
  });

  const [isLicensed, setIsLicensed] = useState("");
  const [lawSocietyLicenseNumber, setLawSocietyLicenseNumber] = useState("");
  const [lawSocietyName, setLawSocietyName] = useState("");
  const [authorizedProvinces, setAuthorizedProvinces] = useState("");

  const [isLicensedInsurance, setIsLicensedInsurance] = useState("");
  const [insuranceLicenseNumber, setInsuranceLicenseNumber] = useState("");
  const [regulatoryBody, setRegulatoryBody] = useState("");
  const [brokerageMga, setBrokerageMga] = useState("");
  const [eoCoverageInsurance, setEoCoverageInsurance] = useState("");

  const [isRegistered, setIsRegistered] = useState("");
  const [regulatoryOrganization, setRegulatoryOrganization] = useState("");
  const [registrationLicenseNumber, setRegistrationLicenseNumber] = useState("");
  const [registeredProvinces, setRegisteredProvinces] = useState("");
  const [eoInsuranceConfirmed, setEoInsuranceConfirmed] = useState(false);
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
      const roleMap: Record<string, Role> = {
        funeral_planner: "funeral-planner",
        estate_lawyer: "lawyer",
        financial_advisor: "financial-advisor",
        insurance_broker: "insurance-broker",
        financial_insurance_agent: "financial_insurance_agent",
      };
      setSelectedRole(roleMap[industry] || "");

      // Restore Step 2 from draft so Back → edit Step 1 → Continue brings them back with their data
      const s2 = draft.step2;
      if (s2) {
        if (s2.businessName != null) setBusinessName(s2.businessName);
        if (Array.isArray(s2.businessNames) && s2.businessNames.length > 0) setBusinessNames(s2.businessNames);
        else if (s2.businessName != null && industry === "funeral_planner") setBusinessNames([s2.businessName]);
        if (s2.professionalTitle != null) setProfessionalTitle(s2.professionalTitle);
        if (Array.isArray(s2.officeLocations) && s2.officeLocations.length > 0) setOfficeLocations(s2.officeLocations);
        if (s2.licensedOrEmployedFuneral != null) setLicensedOrEmployedFuneral(s2.licensedOrEmployedFuneral);
        if (s2.regulatorName != null) setRegulatorName(s2.regulatorName);
        if (s2.preNeedPurpleShield != null) setPreNeedPurpleShield(!!s2.preNeedPurpleShield);
        if (s2.preNeedTrustage != null) setPreNeedTrustage(!!s2.preNeedTrustage);
        if (s2.preNeedFuneralPlansCanada != null) setPreNeedFuneralPlansCanada(!!s2.preNeedFuneralPlansCanada);
        if (s2.preNeedOther != null) setPreNeedOther(!!s2.preNeedOther);
        if (s2.preNeedOtherSpecify != null) setPreNeedOtherSpecify(s2.preNeedOtherSpecify);
        if (s2.isLicensed != null) setIsLicensed(s2.isLicensed);
        if (s2.lawSocietyLicenseNumber != null) setLawSocietyLicenseNumber(s2.lawSocietyLicenseNumber);
        if (s2.lawSocietyName != null) setLawSocietyName(s2.lawSocietyName);
        if (s2.authorizedProvinces != null) setAuthorizedProvinces(s2.authorizedProvinces);
        if (s2.isLicensedInsurance != null) setIsLicensedInsurance(s2.isLicensedInsurance);
        if (s2.insuranceLicenseNumber != null) setInsuranceLicenseNumber(s2.insuranceLicenseNumber);
        if (s2.regulatoryBody != null) setRegulatoryBody(s2.regulatoryBody);
        if (s2.brokerageMga != null) setBrokerageMga(s2.brokerageMga);
        if (s2.eoCoverageInsurance != null) setEoCoverageInsurance(s2.eoCoverageInsurance);
        if (s2.isRegistered != null) setIsRegistered(s2.isRegistered);
        if (s2.regulatoryOrganization != null) setRegulatoryOrganization(s2.regulatoryOrganization);
        if (s2.registrationLicenseNumber != null) setRegistrationLicenseNumber(s2.registrationLicenseNumber);
        if (s2.registeredProvinces != null) setRegisteredProvinces(s2.registeredProvinces);
        if (s2.eoInsuranceConfirmed != null) setEoInsuranceConfirmed(s2.eoInsuranceConfirmed);
      }
    } catch {
      router.replace("/create-account");
    }
  }, [mounted, router]);

  const showFuneral = step1Industry === "funeral_planner";
  const showLawyer = step1Industry === "estate_lawyer";
  const showFinancial = step1Industry === "financial_advisor" || step1Industry === "financial_insurance_agent";
  const showInsurance = step1Industry === "insurance_broker" || step1Industry === "financial_insurance_agent";
  const showInsuranceOnly = step1Industry === "insurance_broker";
  const showFinancialOnly = step1Industry === "financial_advisor";
  const showFinancialAndInsurance = step1Industry === "financial_insurance_agent";

  const removeOfficeLocation = (index: number) => {
    setOfficeLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const addOfficeLocation = () => {
    if (!newLocation.name.trim() || !newLocation.street_address.trim() || !newLocation.city.trim() || !newLocation.province || !newLocation.postal_code.trim()) {
      setError("Please fill in office name, street address, city, province, and postal code.");
      return;
    }
    if (showFuneral) {
      const chosen = (newLocation.associated_firm || "").trim();
      if (!chosen) {
        setError("Please enter or select an Associated business / firm for this office location.");
        return;
      }
    }
    setError(null);
    setOfficeLocations((prev) => [...prev, { ...newLocation }]);
    setNewLocation({
      name: "",
      street_address: "",
      city: "",
      province: "BC",
      postal_code: "",
      associated_firm: "",
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
    if (showFuneral) {
      const names = businessNames.map((n) => n.trim()).filter(Boolean);
      if (names.length === 0 || !professionalTitle.trim()) {
        setError("Please enter at least one Business / Firm Name and your Professional Title.");
        return;
      }
    } else if (!businessName.trim() || !professionalTitle.trim()) {
      setError("Please enter your Business / Firm Name and Professional Title.");
      return;
    }

    const hasOfficeLocations = showFuneral || showLawyer || showInsurance || showFinancial;
    if (hasOfficeLocations && officeLocations.length === 0) {
      setError("Please add at least one office location.");
      return;
    }

    if (showFuneral) {
      if (!licensedOrEmployedFuneral) {
        setError("Please answer whether you are licensed or employed by a funeral establishment.");
        return;
      }
      if (!preNeedPurpleShield && !preNeedTrustage && !preNeedFuneralPlansCanada && !preNeedOther) {
        setError("Please select at least one option (Purple Shield, Trustage, Funeral Plans Canada, or other).");
        return;
      }
      if (preNeedOther && !preNeedOtherSpecify.trim()) {
        setError("Please specify.");
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
      if (!isLicensedInsurance || !insuranceLicenseNumber.trim() || !regulatoryBody.trim() || !brokerageMga.trim() || !eoCoverageInsurance) {
        setError("Please complete all fields for your role.");
        return;
      }
    }
    if (showFinancialAndInsurance) {
      if (!isRegistered || !regulatoryOrganization.trim() || !registrationLicenseNumber.trim() || !eoCoverageInsurance) {
        setError("Please complete all fields for Financial & Insurance advisor.");
        return;
      }
    } else if (showFinancial) {
      if (!isRegistered || !regulatoryOrganization.trim() || !registrationLicenseNumber.trim() || !eoInsuranceConfirmed) {
        setError("Please complete all fields for your role and confirm E&O coverage.");
        return;
      }
    }

    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("createAccountDraft") : null;
      const draft = raw ? JSON.parse(raw) : { step1: {} };
      const step2 = buildStep2Payload();
      sessionStorage.setItem("createAccountDraft", JSON.stringify({ ...draft, step2 }));
    } catch (_) {}
    router.push("/create-account/continue/next");
  };

  const buildStep2Payload = () => ({
    step1Industry,
    selectedRole,
    businessName,
    businessNames: showFuneral ? businessNames : undefined,
    professionalTitle,
    licensedOrEmployedFuneral,
    regulatorName,
    preNeedPurpleShield,
    preNeedTrustage,
    preNeedFuneralPlansCanada,
    preNeedOther,
    preNeedOtherSpecify,
    officeLocations,
    isLicensed,
    lawSocietyLicenseNumber,
    lawSocietyName,
    authorizedProvinces,
    isLicensedInsurance,
    insuranceLicenseNumber,
    regulatoryBody,
    brokerageMga,
    eoCoverageInsurance,
    isRegistered,
    regulatoryOrganization,
    registrationLicenseNumber,
    registeredProvinces,
    eoInsuranceConfirmed,
  });

  const handleBackToStep1 = () => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("createAccountDraft") : null;
      const draft = raw ? JSON.parse(raw) : { step1: {} };
      const step2 = buildStep2Payload();
      sessionStorage.setItem("createAccountDraft", JSON.stringify({ ...draft, step2 }));
    } catch (_) {}
    router.push("/create-account");
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
          {/* Business Name: multiple for funeral, single for others */}
          {showFuneral ? (
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">
                Business / Firm Name(s) <span className="text-red-600">*</span>
              </label>
              {businessNames.map((name, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setBusinessNames((prev) => {
                        const next = [...prev];
                        next[index] = e.target.value;
                        return next;
                      })
                    }
                    className={inputClassName}
                    placeholder="Business or firm name"
                  />
                  {businessNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBusinessNames((prev) => prev.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBusinessNames((prev) => [...prev, ""])}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add business / firm name
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm text-gray-700">
                Business / Firm Name <span className="text-red-600">*</span>
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
          )}

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
                  Are you licensed or employed by a funeral establishment? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="licensedOrEmployedFuneral"
                        value={v}
                        checked={licensedOrEmployedFuneral === v}
                        onChange={(e) => setLicensedOrEmployedFuneral(e.target.value)}
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
                  Are you an enroller or agent for: <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preNeedPurpleShield}
                      onChange={(e) => setPreNeedPurpleShield(e.target.checked)}
                      className="w-4 h-4 border-2 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Purple Shield</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preNeedTrustage}
                      onChange={(e) => setPreNeedTrustage(e.target.checked)}
                      className="w-4 h-4 border-2 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Trustage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preNeedFuneralPlansCanada}
                      onChange={(e) => setPreNeedFuneralPlansCanada(e.target.checked)}
                      className="w-4 h-4 border-2 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Funeral Plans Canada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preNeedOther}
                      onChange={(e) => setPreNeedOther(e.target.checked)}
                      className="w-4 h-4 border-2 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Other</span>
                  </label>
                </div>
                {preNeedOther && (
                  <div className="mt-2 pl-6">
                    <input
                      type="text"
                      value={preNeedOtherSpecify}
                      onChange={(e) => setPreNeedOtherSpecify(e.target.value)}
                      className={inputClassName}
                      placeholder="Please specify"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{loc.name}</div>
                      {showFuneral && (loc as OfficeLocation).associated_firm && (
                        <div className="text-sm text-gray-500">{(loc as OfficeLocation).associated_firm}</div>
                      )}
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
                {(showAddLocation || officeLocations.length === 0) && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                      required
                    />
                    {showFuneral && (
                      <div className="space-y-1">
                        <label className="block text-sm text-gray-700">Associated business / firm <span className="text-red-600">*</span></label>
                        {businessNames.filter((n) => n.trim()).length > 0 ? (
                          <select
                            value={newLocation.associated_firm ?? ""}
                            onChange={(e) => setNewLocation({ ...newLocation, associated_firm: e.target.value })}
                            className={inputClassName}
                            required
                          >
                            <option value="">Select business / firm name</option>
                            {businessNames.filter((n) => n.trim()).map((name) => (
                              <option key={name} value={name.trim()}>{name.trim()}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={newLocation.associated_firm ?? ""}
                            onChange={(e) => setNewLocation({ ...newLocation, associated_firm: e.target.value })}
                            className={inputClassName}
                            placeholder="Business or firm name"
                            required
                          />
                        )}
                      </div>
                    )}
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address *"
                      className={inputClassName}
                      required
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code *"
                        className={inputClassName}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOfficeLocation}
                      className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>
                  </div>
                )}
                {officeLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "", associated_firm: "" });
                      setShowAddLocation(true);
                    }}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                )}
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
                <label className="block text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
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
                {(showAddLocation || officeLocations.length === 0) && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                      required
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address *"
                      className={inputClassName}
                      required
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code *"
                        className={inputClassName}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOfficeLocation}
                      className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>
                  </div>
                )}
                {officeLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "", associated_firm: "" });
                      setShowAddLocation(true);
                    }}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                )}
              </div>
            </>
          )}

          {/* Insurance Broker only */}
          {showInsuranceOnly && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you licensed in Canada? <span className="text-red-600">*</span>
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
                        required={showInsuranceOnly}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="insuranceLicenseNumber" className="text-sm text-gray-700">
                  License number <span className="text-red-600">*</span>
                </label>
                <input
                  id="insuranceLicenseNumber"
                  type="text"
                  value={insuranceLicenseNumber}
                  onChange={(e) => setInsuranceLicenseNumber(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="regulatoryBody" className="text-sm text-gray-700">
                  Regulatory body <span className="text-red-600">*</span>
                </label>
                <input
                  id="regulatoryBody"
                  type="text"
                  value={regulatoryBody}
                  onChange={(e) => setRegulatoryBody(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="brokerageMga" className="text-sm text-gray-700">
                  Brokerage / MGA / Sponsoring organization <span className="text-red-600">*</span>
                </label>
                <input
                  id="brokerageMga"
                  type="text"
                  value={brokerageMga}
                  onChange={(e) => setBrokerageMga(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  I maintain required Errors &amp; Omissions coverage <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eoCoverageInsurance"
                        value={v}
                        checked={eoCoverageInsurance === v}
                        onChange={(e) => setEoCoverageInsurance(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showInsuranceOnly}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
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
                {(showAddLocation || officeLocations.length === 0) && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                      required
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address *"
                      className={inputClassName}
                      required
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code *"
                        className={inputClassName}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOfficeLocation}
                      className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>
                  </div>
                )}
                {officeLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "", associated_firm: "" });
                      setShowAddLocation(true);
                    }}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                )}
              </div>
            </>
          )}

          {/* Financial & Insurance advisor (simplified) */}
          {showFinancialAndInsurance && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you licensed to provide regulated financial or insurance services? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isRegisteredDual"
                        value={v}
                        checked={isRegistered === v}
                        onChange={(e) => setIsRegistered(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFinancialAndInsurance}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="regulatoryOrganizationDual" className="text-sm text-gray-700">
                  Primary regulatory body <span className="text-red-600">*</span>
                </label>
                <input
                  id="regulatoryOrganizationDual"
                  type="text"
                  value={regulatoryOrganization}
                  onChange={(e) => setRegulatoryOrganization(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. IIROC / CIRO, MFDA / CIRO, Provincial Insurance Council"
                  required={showFinancialAndInsurance}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="registrationLicenseNumberDual" className="text-sm text-gray-700">
                  License / Registration number <span className="text-red-600">*</span>
                </label>
                <input
                  id="registrationLicenseNumberDual"
                  type="text"
                  value={registrationLicenseNumber}
                  onChange={(e) => setRegistrationLicenseNumber(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. registration or license number"
                  required={showFinancialAndInsurance}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Do you maintain active Errors &amp; Omissions (E&O) insurance? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-6">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eoCoverageInsuranceDual"
                        value={v}
                        checked={eoCoverageInsurance === v}
                        onChange={(e) => setEoCoverageInsurance(e.target.value)}
                        className="w-4 h-4 border-2 border-gray-300"
                        required={showFinancialAndInsurance}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
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
                {(showAddLocation || officeLocations.length === 0) && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                      required
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address *"
                      className={inputClassName}
                      required
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code *"
                        className={inputClassName}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOfficeLocation}
                      className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>
                  </div>
                )}
                {officeLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "", associated_firm: "" });
                      setShowAddLocation(true);
                    }}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                )}
              </div>
            </>
          )}

          {/* Financial Advisor only */}
          {showFinancialOnly && (
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
                        required={showFinancialOnly}
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="regulatoryOrganization" className="text-sm text-gray-700">
                  Regulatory organization name <span className="text-red-600">*</span>
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
                <label htmlFor="registrationLicenseNumber" className="text-sm text-gray-700">
                  License / Registration number <span className="text-red-600">*</span>
                </label>
                <input
                  id="registrationLicenseNumber"
                  type="text"
                  value={registrationLicenseNumber}
                  onChange={(e) => setRegistrationLicenseNumber(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g. registration or license number"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eoInsuranceConfirmed}
                    onChange={(e) => setEoInsuranceConfirmed(e.target.checked)}
                    className="w-4 h-4 border-2 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I maintain required E&O / professional liability coverage. <span className="text-red-600">*</span>
                  </span>
                </label>
              </div>
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm text-gray-700 font-medium">Office Locations <span className="text-red-600">*</span></label>
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
                {(showAddLocation || officeLocations.length === 0) && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">New Office Location</h4>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Office name *"
                      className={inputClassName}
                      required
                    />
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                      placeholder="Street address *"
                      className={inputClassName}
                      required
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="City *"
                        className={inputClassName}
                        required
                      />
                      <select
                        value={newLocation.province}
                        onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                        className={inputClassName}
                        required
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newLocation.postal_code}
                        onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                        placeholder="Postal code *"
                        className={inputClassName}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addOfficeLocation}
                      className="px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800"
                    >
                      Save
                    </button>
                  </div>
                )}
                {officeLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewLocation({ name: "", street_address: "", city: "", province: "BC", postal_code: "", associated_firm: "" });
                      setShowAddLocation(true);
                    }}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                )}
              </div>
            </>
          )}

          {/* Back and Continue buttons - Back saves current form to draft so it's there when they return */}
          {(showFuneral || showLawyer || showInsurance || showFinancial) && officeLocations.length === 0 && (
            <p className="mt-4 text-sm text-amber-700">Save at least one office location to continue.</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="flex-1 py-3 px-4 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={(showFuneral || showLawyer || showInsurance || showFinancial) && officeLocations.length === 0}
              className="flex-1 bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
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
