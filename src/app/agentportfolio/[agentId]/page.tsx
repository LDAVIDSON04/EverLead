"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { AgentHeader } from "./components/AgentHeader";
import { TrustHighlights } from "./components/TrustHighlights";
import { AboutSection } from "./components/AboutSection";
import { OfficeLocations } from "./components/OfficeLocations";
import { Reviews } from "./components/Reviews";
import { BookingPanel } from "./components/BookingPanel";

function AgentProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params?.agentId as string;
  const isReschedule = searchParams?.get("reschedule") === "true";

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
          const regionsServed = (metadata as any)?.regions_served_array || 
            ((metadata as any)?.regions_served ? (metadata as any).regions_served.split(',').map((r: string) => r.trim()) : []);
          const trustageEnroller = (metadata as any)?.trustage_enroller_number === true || (metadata as any)?.trustage_enroller_number === 'yes';
          const llqpLicense = (metadata as any)?.llqp_license === true || (metadata as any)?.llqp_license === 'yes';
          const llqpQuebec = (metadata as any)?.llqp_quebec || null;
          
          // Build credentials string
          let credentialsParts = [];
          if (trustageEnroller) credentialsParts.push('TruStage Enroller');
          if (llqpLicense) {
            credentialsParts.push('LLQP Licensed');
            if (llqpQuebec && llqpQuebec !== 'non-applicable') {
              credentialsParts.push(`Quebec: ${llqpQuebec === 'yes' ? 'Valid' : 'Not Valid'}`);
            }
          }
          const credentials = credentialsParts.length > 0 ? credentialsParts.join(', ') : 'Licensed Professional';
          
          // Use AI-generated bio if it exists (bios are auto-approved on creation)
          const hasApprovedBio = !!data.ai_generated_bio;
          const fallbackSummary = `${data.full_name || 'This agent'} brings years of compassionate expertise in end-of-life planning and grief support. ${specialty || 'They help'} families navigate difficult decisions with dignity and care.`;
          const fallbackFullBio = `${data.full_name || 'This agent'}'s journey into end-of-life care is driven by a commitment to helping families during life's most challenging moments.\n\n${specialty || 'Their expertise'} allows them to address both the emotional and practical aspects of end-of-life planning.\n\nThey are known for their patient, non-judgmental approach and their ability to facilitate difficult family conversations.`;
          
          // Fetch review stats
          let rating = 0;
          let reviewCount = 0;
          try {
            const reviewResponse = await fetch(`/api/reviews/agent/${agentId}`);
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              rating = reviewData.averageRating || 0;
              reviewCount = reviewData.totalReviews || 0;
            }
          } catch (err) {
            console.error("Error fetching review stats:", err);
          }

          setAgentData({
            ...data,
            specialty: specialty,
            regionsServed: regionsServed,
            trustageEnroller: trustageEnroller,
            llqpLicense: llqpLicense,
            llqpQuebec: llqpQuebec,
            credentials: credentials,
            rating: rating,
            reviewCount: reviewCount,
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

      {/* Reschedule Banner */}
      {isReschedule && (
        <div className="bg-[#0D5C3D] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="font-semibold">Rescheduling Your Appointment</p>
                <p className="text-sm text-green-100">Select a new date and time below. Your previous appointment has been cancelled.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              location=""
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
            <TrustHighlights agentId={agentId} />
          </div>

          {/* Right Column - Sticky Booking Panel (5 columns) */}
          <div className="lg:col-span-5">
            <BookingPanel agentId={agentId} />
          </div>
        </div>

        {/* Full-width sections below two-column layout */}
        <div className="mt-8">
          <Reviews agentId={agentId} reviewCount={agentData.reviewCount} />
          <Suspense fallback={<div className="mb-12"><h2 className="text-3xl font-medium text-gray-900 mb-6">Office locations</h2><p className="text-gray-600">Loading...</p></div>}>
            <OfficeLocations agentData={agentData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function AgentProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d2e] mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    }>
      <AgentProfileContent />
    </Suspense>
  );
}
