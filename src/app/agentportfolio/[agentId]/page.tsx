"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params?.agentId as string;

  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setError("No agent ID provided");
      setLoading(false);
      return;
    }

    async function loadAgent() {
      try {
        const { data, error: fetchError } = await supabaseClient
          .from("profiles")
          .select("id, full_name, first_name, last_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, email, phone, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .maybeSingle();
        
        if (fetchError) {
          setError(fetchError.message);
        } else if (data) {
          const metadata = data.metadata || {};
          setAgentData({
            ...data,
            specialty: metadata?.specialty || null,
            license_number: metadata?.license_number || null,
            business_street: metadata?.business_street || null,
            business_city: metadata?.business_city || null,
            business_province: metadata?.business_province || null,
            business_zip: metadata?.business_zip || null,
          });
        } else {
          setError("Agent not found");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load agent");
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !agentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-gray-600 mb-4 text-lg">{error || "Agent not found"}</p>
          <Link
            href="/search"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  const location = agentData.agent_city && agentData.agent_province
    ? `${agentData.agent_city}, ${agentData.agent_province}`
    : agentData.agent_city || agentData.agent_province || 'Location not specified';

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Search</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-6 mb-6">
            {agentData.profile_picture_url ? (
              <img
                src={agentData.profile_picture_url}
                alt={agentData.full_name}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 text-4xl font-semibold">
                  {(agentData.full_name || "A")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {agentData.full_name || "Agent"}
              </h1>
              <p className="text-lg text-gray-600 mb-1">
                {agentData.job_title || "Pre-need Planning Specialist"}
              </p>
              {agentData.funeral_home && (
                <p className="text-gray-500 mb-2">{agentData.funeral_home}</p>
              )}
              <p className="text-gray-600">{location}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600 leading-relaxed">
              {agentData.full_name || "This agent"} brings years of compassionate expertise in end-of-life planning and grief support. 
              {agentData.specialty && ` They specialize in ${agentData.specialty}.`} 
              They help families navigate difficult decisions with dignity and care.
            </p>
          </div>

          {agentData.business_street && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Location</h2>
              <p className="text-gray-600">
                {agentData.business_street}
                {agentData.business_city && `, ${agentData.business_city}`}
                {agentData.business_province && `, ${agentData.business_province}`}
                {agentData.business_zip && ` ${agentData.business_zip}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
