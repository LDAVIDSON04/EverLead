"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Check, X, AlertCircle, Eye, Clock, FileText, RefreshCw } from "lucide-react";

type ProfileBio = {
  id: string;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  funeral_home: string | null;
  agent_city: string | null;
  agent_province: string | null;
  ai_generated_bio: string | null;
  bio_approval_status: string | null;
  bio_last_updated: string | null;
  metadata: any;
};

export default function ProfileBiosPage() {
  const [bios, setBios] = useState<ProfileBio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBio, setSelectedBio] = useState<ProfileBio | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadBios();
  }, [filter]);

  async function loadBios() {
    try {
      setLoading(true);
      setError(null);

      let query = supabaseClient
        .from('profiles')
        .select('id, full_name, email, job_title, funeral_home, agent_city, agent_province, ai_generated_bio, bio_approval_status, bio_last_updated, metadata')
        .eq('role', 'agent')
        .not('ai_generated_bio', 'is', null);

      if (filter !== 'all') {
        query = query.eq('bio_approval_status', filter);
      }

      const { data, error: fetchError } = await query.order('bio_last_updated', { ascending: false });

      if (fetchError) {
        throw new Error("Failed to fetch profile bios");
      }

      setBios((data || []) as ProfileBio[]);
    } catch (err: any) {
      console.error("Error loading bios:", err);
      setError(err.message || "Failed to load profile bios");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (processing) return;

    try {
      setProcessing(id);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to approve bios.");
      }

      // Get current bio for audit log
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('ai_generated_bio, bio_audit_log')
        .eq('id', id)
        .single();

      const auditLog = profile?.bio_audit_log || [];
      const newAuditEntry = {
        action: 'approved',
        timestamp: new Date().toISOString(),
        admin_id: user.id,
        bio: profile?.ai_generated_bio,
      };

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          bio_approval_status: 'approved',
          bio_last_updated: new Date().toISOString(),
          bio_audit_log: [...auditLog, newAuditEntry],
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to approve bio");
      }

      await loadBios();
      setSelectedBio(null);
    } catch (err: any) {
      console.error("Error approving bio:", err);
      setError(err.message || "Failed to approve bio. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (processing) return;

    try {
      setProcessing(id);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to reject bios.");
      }

      // Get current bio for audit log
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('ai_generated_bio, bio_audit_log')
        .eq('id', id)
        .single();

      const auditLog = profile?.bio_audit_log || [];
      const newAuditEntry = {
        action: 'rejected',
        timestamp: new Date().toISOString(),
        admin_id: user.id,
        bio: profile?.ai_generated_bio,
      };

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          bio_approval_status: 'rejected',
          bio_last_updated: new Date().toISOString(),
          bio_audit_log: [...auditLog, newAuditEntry],
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to reject bio");
      }

      await loadBios();
      setSelectedBio(null);
    } catch (err: any) {
      console.error("Error rejecting bio:", err);
      setError(err.message || "Failed to reject bio. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = bios.filter(b => b.bio_approval_status === 'pending').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-gray-800" />
          <h1 className="text-3xl font-semibold text-gray-900">Profile Bios</h1>
        </div>
        <p className="text-gray-600">Review and approve AI-generated profile bios for agents</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'pending'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'approved'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'rejected'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mb-4"></div>
            <p className="text-sm text-gray-600">Loading profile bios...</p>
          </div>
        </div>
      ) : bios.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2 text-lg font-medium">
            {filter === 'pending' 
              ? 'No pending bios to review'
              : filter === 'approved'
              ? 'No approved bios'
              : filter === 'rejected'
              ? 'No rejected bios'
              : 'No profile bios found'}
          </p>
          <p className="text-gray-500 text-sm">
            {filter === 'pending' 
              ? 'All bios have been reviewed or no bios have been generated yet.'
              : 'Change the filter to see bios in other statuses.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bios.map((bio) => (
            <div
              key={bio.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {bio.full_name || 'Unknown Agent'}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bio.bio_approval_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : bio.bio_approval_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {bio.bio_approval_status || 'pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-4 text-sm text-gray-600">
                    {bio.job_title && (
                      <p><span className="font-medium">Title:</span> {bio.job_title}</p>
                    )}
                    {bio.funeral_home && (
                      <p><span className="font-medium">Organization:</span> {bio.funeral_home}</p>
                    )}
                    {(bio.agent_city || bio.agent_province) && (
                      <p>
                        <span className="font-medium">Location:</span>{' '}
                        {[bio.agent_city, bio.agent_province].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {bio.email && (
                      <p><span className="font-medium">Email:</span> {bio.email}</p>
                    )}
                    {bio.bio_last_updated && (
                      <p className="text-xs text-gray-500">
                        Last updated: {new Date(bio.bio_last_updated).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Bio Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {bio.ai_generated_bio || 'No bio generated yet.'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {bio.bio_approval_status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(bio.id)}
                      disabled={processing === bio.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(bio.id)}
                      disabled={processing === bio.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
