"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Star, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AgentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      loadAgentProfile(agentId);
    }
  }, [agentId]);

  const loadAgentProfile = async (agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, first_name, last_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, email, phone, metadata")
        .eq("id", agentId)
        .eq("role", "agent")
        .single();
      
      if (fetchError) {
        console.error("Error loading agent profile:", fetchError);
        setError("Failed to load agent profile");
        setAgentData(null);
      } else if (data) {
        const metadata = data.metadata || {};
        setAgentData({
          ...data,
          business_address: (metadata as any)?.business_address || null,
          business_street: (metadata as any)?.business_street || null,
          business_city: (metadata as any)?.business_city || null,
          business_province: (metadata as any)?.business_province || null,
          business_zip: (metadata as any)?.business_zip || null,
          regions_served: (metadata as any)?.regions_served || null,
          specialty: (metadata as any)?.specialty || null,
          license_number: (metadata as any)?.license_number || null,
        });
      } else {
        setError("Agent not found");
        setAgentData(null);
      }
    } catch (err) {
      console.error("Error loading agent profile:", err);
      setError("An error occurred while loading the profile");
      setAgentData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !agentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Agent not found"}</p>
          <Link
            href="/search"
            className="inline-block bg-green-800 hover:bg-green-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Search</span>
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            {agentData.profile_picture_url ? (
              <img
                src={agentData.profile_picture_url}
                alt={agentData.full_name || "Agent"}
                className="w-32 h-32 rounded-full object-cover border-4 border-green-600"
              />
            ) : (
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-600">
                <span className="text-green-700 text-4xl font-semibold">
                  {(agentData.full_name || "A")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black mb-2">
                {agentData.full_name || "Agent"}
              </h1>
              {agentData.job_title && (
                <p className="text-xl text-gray-700 font-medium mb-1">{agentData.job_title}</p>
              )}
              {agentData.funeral_home && (
                <p className="text-lg text-gray-600 mb-4">{agentData.funeral_home}</p>
              )}
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold text-gray-900">4.9</span>
                <span className="text-lg text-gray-600">({Math.floor(Math.random() * 200 + 50)} reviews)</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {agentData.agent_city && agentData.agent_province && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-gray-600">
                    {agentData.agent_city}, {agentData.agent_province}
                  </p>
                </div>
              </div>
            )}
            
            {(agentData.business_street || agentData.business_address) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Business Address</p>
                  <p className="text-gray-600 text-sm">
                    {agentData.business_street && agentData.business_city && agentData.business_province && agentData.business_zip
                      ? `${agentData.business_street}, ${agentData.business_city}, ${agentData.business_province} ${agentData.business_zip}`
                      : agentData.business_address || `${agentData.business_street || ''}${agentData.business_city ? `, ${agentData.business_city}` : ''}${agentData.business_province ? `, ${agentData.business_province}` : ''}${agentData.business_zip ? ` ${agentData.business_zip}` : ''}`.trim()}
                  </p>
                </div>
              </div>
            )}
            
            {agentData.phone && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500">📞</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-gray-600">{agentData.phone}</p>
                </div>
              </div>
            )}
            
            {agentData.email && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500">✉️</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">{agentData.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {(agentData.specialty || agentData.regions_served || agentData.license_number) && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              {agentData.specialty && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Specialty / Services</p>
                  <p className="text-gray-600">{agentData.specialty}</p>
                </div>
              )}
              
              {agentData.regions_served && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Regions Served</p>
                  <p className="text-gray-600">{agentData.regions_served}</p>
                </div>
              )}
              
              {agentData.license_number && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">License Number</p>
                  <p className="text-gray-600">{agentData.license_number}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
