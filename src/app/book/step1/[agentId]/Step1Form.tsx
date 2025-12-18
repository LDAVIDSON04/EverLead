"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Info, Calendar } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function Step1Form() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const agentId = params?.agentId as string || "";
  const startsAt = searchParams.get("startsAt") || "";
  const endsAt = searchParams.get("endsAt") || "";
  const date = searchParams.get("date") || "";

  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    legalFirstName: "",
    legalLastName: "",
    dateOfBirth: "",
    sex: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!agentId) return;
    
    async function loadAgent() {
      try {
        const { data } = await supabaseClient
          .from("profiles")
          .select("full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (data) setAgentInfo(data);
      } catch (err) {
        console.error("Error loading agent:", err);
      }
    }
    
    loadAgent();
  }, [agentId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const formatTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }
    
    if (!formData.legalFirstName.trim()) {
      newErrors.legalFirstName = "First name is required";
    }
    
    if (!formData.legalLastName.trim()) {
      newErrors.legalLastName = "Last name is required";
    }
    
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Use mm/dd/yyyy format";
    }
    
    if (!formData.sex) {
      newErrors.sex = "Please select sex";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    const params = new URLSearchParams({
      agentId,
      startsAt,
      endsAt,
      date,
      email: formData.email,
      legalFirstName: formData.legalFirstName,
      legalLastName: formData.legalLastName,
      dateOfBirth: formData.dateOfBirth,
      sex: formData.sex,
    });
    
    router.push(`/book/step2?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/Soradin.png" alt="Soradin" width={40} height={40} className="h-10 w-10" />
              <span className="text-xl font-semibold text-gray-900">Soradin</span>
            </Link>
            <Link href="/search" className="text-gray-600 hover:text-gray-900 text-sm">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4 py-8">
        {agentInfo && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start gap-4">
              {agentInfo.profile_picture_url ? (
                <img src={agentInfo.profile_picture_url} alt={agentInfo.full_name || "Agent"} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">
                    {(agentInfo.first_name?.[0] || agentInfo.full_name?.[0] || "A").toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {agentInfo.full_name || `${agentInfo.first_name || ""} ${agentInfo.last_name || ""}`.trim() || "Pre-need Specialist"}
                </h2>
                <p className="text-gray-600 text-sm mb-3">
                  {agentInfo.job_title || "Pre-need Planning Specialist"}
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  {startsAt && date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(date)}, {formatTime(startsAt)}</span>
                    </div>
                  )}
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
        )}

        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Tell us a bit about you
          </h1>
          <p className="text-gray-600 mb-8">
            To book your appointment, we need to verify a few things for {agentInfo?.full_name || "the agent"}'s office.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

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
                  onChange={(e) => handleChange("legalFirstName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    errors.legalFirstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="John"
                />
                {errors.legalFirstName && <p className="text-sm text-red-500 mt-1">{errors.legalFirstName}</p>}
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
                  onChange={(e) => handleChange("legalLastName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    errors.legalLastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Doe"
                />
                {errors.legalLastName && <p className="text-sm text-red-500 mt-1">{errors.legalLastName}</p>}
              </div>
            </div>

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
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 ${
                    errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="mm/dd/yyyy"
                  maxLength={10}
                />
              </div>
              {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>

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
                    onChange={(e) => handleChange("sex", e.target.value)}
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
                    onChange={(e) => handleChange("sex", e.target.value)}
                    className="w-4 h-4 text-green-800 focus:ring-green-800"
                  />
                  <span className="text-gray-700">Female</span>
                </label>
              </div>
              {errors.sex && <p className="text-sm text-red-500 mt-1">{errors.sex}</p>}
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full bg-green-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-900 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
