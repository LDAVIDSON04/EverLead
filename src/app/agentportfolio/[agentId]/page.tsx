"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentHeader } from "./components/AgentHeader";
import { TrustHighlights } from "./components/TrustHighlights";
import { AboutSection } from "./components/AboutSection";
import { OfficeLocations } from "./components/OfficeLocations";
import { Reviews } from "./components/Reviews";
import { BookingPanel } from "./components/BookingPanel";

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
          .select("id, full_name, first_name, last_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, email, phone, metadata, ai_generated_bio, bio_approval_status, approval_status")
          .eq("id", agentId)
          .eq("role", "agent")
          .maybeSingle();
        
        if (fetchError) {
          setError(fetchError.message);
        } else if (data) {
          // Single unified approval - check only approval_status
          if (data.approval_status !== "approved") {
            setError("Agent profile not available");
            setLoading(false);
            return;
          }
          const metadata = data.metadata || {};
          const specialty = (metadata as any)?.specialty || null;
          const licenseNumber = (metadata as any)?.license_number || null;
          
          // Use AI-generated bio if approved, otherwise use fallback
          const hasApprovedBio = data.bio_approval_status === 'approved' && data.ai_generated_bio;
          const fallbackSummary = `${data.full_name || 'This agent'} brings years of compassionate expertise in end-of-life planning and grief support. ${specialty || 'They help'} families navigate difficult decisions with dignity and care.`;
          const fallbackFullBio = `${data.full_name || 'This agent'}'s journey into end-of-life care is driven by a commitment to helping families during life's most challenging moments.\n\n${specialty || 'Their expertise'} allows them to address both the emotional and practical aspects of end-of-life planning.\n\nThey are known for their patient, non-judgmental approach and their ability to facilitate difficult family conversations.`;
          
          setAgentData({
            ...data,
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
            specialty: specialty,
            license_number: licenseNumber,
            credentials: licenseNumber ? `LFD, ${licenseNumber}` : 'LFD',
            rating: 4.9,
            reviewCount: Math.floor(Math.random() * 200 + 50),
            verified: true,
            summary: hasApprovedBio ? data.ai_generated_bio.split('\n\n')[0] || data.ai_generated_bio : fallbackSummary,
            fullBio: hasApprovedBio ? data.ai_generated_bio : fallbackFullBio,
            aiGeneratedBio: hasApprovedBio ? data.ai_generated_bio : null,
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d2e] mb-4"></div>
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
            className="inline-block bg-[#1a4d2e] hover:bg-[#0f2e1c] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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
      {/* Header with Back Button */}
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

      {/* Main Container - Matching Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content (7 columns) */}
          <div className="lg:col-span-7">
            <AgentHeader 
              name={agentData.full_name || "Agent"}
              credentials={agentData.credentials}
              specialty={agentData.specialty || agentData.job_title || "Pre-need Planning Specialist"}
              location={location}
              rating={agentData.rating}
              reviewCount={agentData.reviewCount}
              imageUrl={agentData.profile_picture_url || ""}
              verified={agentData.verified}
            />
            <AboutSection
              aiGeneratedBio={agentData.aiGeneratedBio} 
              summary={agentData.summary} 
              fullBio={agentData.fullBio} 
            />
            <TrustHighlights />
          </div>

          {/* Right Column - Sticky Booking Panel (5 columns) */}
          <div className="lg:col-span-5">
            <BookingPanel agentId={agentId} />
          </div>
        </div>

        {/* Full-width sections below two-column layout */}
        <div className="mt-8">
          <Reviews reviewCount={agentData.reviewCount} />
          <Suspense fallback={<div className="mb-12"><h2 className="text-3xl font-medium text-gray-900 mb-6">Office locations</h2><p className="text-gray-600">Loading...</p></div>}>
            <OfficeLocations agentData={agentData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
