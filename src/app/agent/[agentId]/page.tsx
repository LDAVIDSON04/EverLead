"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      // Just verify the agent exists, then show blank page
      verifyAgent(agentId);
    } else {
      setError("Invalid agent ID");
      setLoading(false);
    }
  }, [agentId]);

  const verifyAgent = async (agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("id", agentId)
        .eq("role", "agent")
        .single();
      
      if (fetchError || !data) {
        setError("Agent not found");
      }
    } catch (err) {
      console.error("Error verifying agent:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
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

  // Blank page - ready for design
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

      {/* Blank Content Area - Ready for Design */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 min-h-[400px]">
          {/* This page is ready for your design */}
        </div>
      </main>
    </div>
  );
}
