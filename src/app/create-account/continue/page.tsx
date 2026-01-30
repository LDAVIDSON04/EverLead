"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Role =
  | "funeral-planner"
  | "lawyer"
  | "insurance-broker"
  | "financial-advisor"
  | "";

const roles = [
  { value: "funeral-planner" as const, label: "Funeral Planner" },
  { value: "lawyer" as const, label: "Lawyer" },
  { value: "insurance-broker" as const, label: "Insurance Broker" },
  { value: "financial-advisor" as const, label: "Financial Advisor" },
];

const inputClassName =
  "w-full h-11 px-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black";

export default function CreateAccountContinuePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("");
  const [businessName, setBusinessName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");

  const [hasTruStage, setHasTruStage] = useState("");
  const [hasLLQP, setHasLLQP] = useState("");
  const [llqpQuebec, setLlqpQuebec] = useState("");
  const [officeLocations, setOfficeLocations] = useState<string[]>([]);

  const [isLicensed, setIsLicensed] = useState("");
  const [lawSocietyName, setLawSocietyName] = useState("");
  const [authorizedProvinces, setAuthorizedProvinces] = useState("");

  const [isLicensedInsurance, setIsLicensedInsurance] = useState("");
  const [licensingProvince, setLicensingProvince] = useState("");
  const [hasMultipleProvinces, setHasMultipleProvinces] = useState("");
  const [additionalProvinces, setAdditionalProvinces] = useState("");

  const [isRegistered, setIsRegistered] = useState("");
  const [regulatoryOrganization, setRegulatoryOrganization] = useState("");
  const [registeredProvinces, setRegisteredProvinces] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/create-account/continue/next");
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 py-4">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Soradin.png"
            alt="Soradin"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-black">Soradin</span>
        </Link>
      </div>

      <div className="max-w-[700px] mx-auto">
        <h1 className="text-2xl mb-8 text-black">Create an account</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm text-gray-700">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`px-6 py-3 border rounded-md text-sm transition-colors ${
                    selectedRole === role.value
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm text-gray-700">
              Business/ Firm Name
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
              Professional Title
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
          {selectedRole === "funeral-planner" && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Do you have a valid TruStage Life of Canada enrolee number?
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
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Do you have a valid LLQP license?
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
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Is your LLQP valid in Quebec?
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
                      />
                      <span className="text-sm text-gray-700">
                        {v === "non-applicable" ? "Non Applicable" : v.charAt(0).toUpperCase() + v.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">Office Locations</label>
                {officeLocations.map((location, index) => (
                  <input
                    key={index}
                    type="text"
                    value={location}
                    onChange={(e) => {
                      const next = [...officeLocations];
                      next[index] = e.target.value;
                      setOfficeLocations(next);
                    }}
                    className={inputClassName}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOfficeLocations([...officeLocations, ""])}
                  className="flex items-center gap-2 text-sm text-black hover:underline"
                >
                  <span className="text-lg">+</span> Add location
                </button>
              </div>
            </>
          )}

          {/* Lawyer */}
          {selectedRole === "lawyer" && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you currently licensed and in good standing with your provincial law society?
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
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="lawSocietyName" className="text-sm text-gray-700">
                  Law society name
                </label>
                <input
                  id="lawSocietyName"
                  type="text"
                  value={lawSocietyName}
                  onChange={(e) => setLawSocietyName(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="authorizedProvinces" className="text-sm text-gray-700">
                  Province(s) you are authorized to practice in
                </label>
                <input
                  id="authorizedProvinces"
                  type="text"
                  value={authorizedProvinces}
                  onChange={(e) => setAuthorizedProvinces(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">Office Locations</label>
                {officeLocations.map((location, index) => (
                  <input
                    key={index}
                    type="text"
                    value={location}
                    onChange={(e) => {
                      const next = [...officeLocations];
                      next[index] = e.target.value;
                      setOfficeLocations(next);
                    }}
                    className={inputClassName}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOfficeLocations([...officeLocations, ""])}
                  className="flex items-center gap-2 text-sm text-black hover:underline"
                >
                  <span className="text-lg">+</span> Add location
                </button>
              </div>
            </>
          )}

          {/* Insurance Broker */}
          {selectedRole === "insurance-broker" && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you a licensed life insurance agent in Canada?
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
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="licensingProvince" className="text-sm text-gray-700">
                  Licensing province
                </label>
                <input
                  id="licensingProvince"
                  type="text"
                  value={licensingProvince}
                  onChange={(e) => setLicensingProvince(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you licensed in multiple provinces?
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
              <div className="space-y-3">
                <label className="text-sm text-gray-700">Office Locations</label>
                {officeLocations.map((location, index) => (
                  <input
                    key={index}
                    type="text"
                    value={location}
                    onChange={(e) => {
                      const next = [...officeLocations];
                      next[index] = e.target.value;
                      setOfficeLocations(next);
                    }}
                    className={inputClassName}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOfficeLocations([...officeLocations, ""])}
                  className="flex items-center gap-2 text-sm text-black hover:underline"
                >
                  <span className="text-lg">+</span> Add location
                </button>
              </div>
            </>
          )}

          {/* Financial Advisor */}
          {selectedRole === "financial-advisor" && (
            <>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">
                  Are you registered with a regulatory organization?
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
                      />
                      <span className="text-sm text-gray-700 capitalize">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="regulatoryOrganization" className="text-sm text-gray-700">
                  Regulatory organization
                </label>
                <input
                  id="regulatoryOrganization"
                  type="text"
                  value={regulatoryOrganization}
                  onChange={(e) => setRegulatoryOrganization(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="registeredProvinces" className="text-sm text-gray-700">
                  Province(s) you are registered in
                </label>
                <input
                  id="registeredProvinces"
                  type="text"
                  value={registeredProvinces}
                  onChange={(e) => setRegisteredProvinces(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-gray-700">Office Locations</label>
                {officeLocations.map((location, index) => (
                  <input
                    key={index}
                    type="text"
                    value={location}
                    onChange={(e) => {
                      const next = [...officeLocations];
                      next[index] = e.target.value;
                      setOfficeLocations(next);
                    }}
                    className={inputClassName}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setOfficeLocations([...officeLocations, ""])}
                  className="flex items-center gap-2 text-sm text-black hover:underline"
                >
                  <span className="text-lg">+</span> Add location
                </button>
              </div>
            </>
          )}

          {/* Back & Next */}
          <div className="pt-4">
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push("/create-account")}
                className="px-8 bg-white text-black border border-gray-300 hover:bg-gray-50 h-12 rounded-md text-sm font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-8 bg-black text-white hover:bg-black/90 h-12 rounded-md text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/agent" className="text-black underline hover:no-underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
