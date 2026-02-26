"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import { Check, X, AlertCircle, Download, Eye, Clock, FileText, User, Building, MapPin, Mail, Phone } from "lucide-react";

type OfficeLocationDisplay = {
  name: string;
  street_address: string | null;
  city: string;
  province: string;
  postal_code: string | null;
};

type PendingAgent = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  funeral_home: string | null;
  job_title: string | null;
  licensed_in_province: boolean;
  licensed_funeral_director: boolean;
  notification_cities: Array<{ city: string; province: string }> | null;
  created_at: string;
  approval_status: string | null;
  approval_notes: string | null;
  ai_generated_bio: string | null;
  bio_approval_status: string | null;
  bio_last_updated: string | null;
  metadata: any;
  office_locations?: OfficeLocationDisplay[];
};

type Specialist = {
  id: string;
  name: string;
  company: string;
  region: string;
  specialty: string;
  email: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs-info';
  documents: Array<{ name: string; uploaded: boolean }>;
  notes: string;
  tags: string[];
  bio: string | null;
  bioStatus: string | null;
  profileStatus: string | null;
};

export default function AgentApprovalPage() {
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; type: 'approve' | 'decline' | 'needs-info' } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoText, setRequestInfoText] = useState("");

  useEffect(() => {
    loadPendingAgents();
  }, []);

  async function loadPendingAgents() {
    try {
      setLoading(true);
      setError(null);

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/pending-agents", { headers: authHeaders });
      if (!res.ok) {
        throw new Error("Failed to fetch pending agents");
      }

      const agentsWithEmail = await res.json();
      setPendingAgents(agentsWithEmail as PendingAgent[]);
    } catch (err: any) {
      console.error("Error loading pending agents:", err);
      setError(err.message || "Failed to load pending agents");
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
        throw new Error("You must be logged in to approve agents.");
      }

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: id, action: "approve" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve agent");
      }

      // Show success message
      const agentName = pendingAgents.find(a => a.id === id)?.full_name || 'Agent';
      setSuccess({ message: `${agentName} has been successfully approved!`, type: 'approve' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      await loadPendingAgents();
    } catch (err: any) {
      console.error("Error approving agent:", err);
      setError(err.message || "Failed to approve agent. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (processing) return;

    const reason = prompt("Please provide a reason for declining (optional):");
    if (reason === null) return;

    try {
      setProcessing(id);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to decline agents.");
      }

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: id, action: "decline", notes: reason || undefined }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to decline agent");
      }

      // Show success message
      const agentName = pendingAgents.find(a => a.id === id)?.full_name || 'Agent';
      setSuccess({ message: `${agentName} has been successfully declined.`, type: 'decline' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      await loadPendingAgents();
    } catch (err: any) {
      console.error("Error declining agent:", err);
      setError(err.message || "Failed to decline agent. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleRequestInfo(id: string) {
    if (processing) return;

    const agent = pendingAgents.find(a => a.id === id);
    if (!agent) return;

    setSelectedAgent(agent);
    setShowRequestInfoModal(true);
    setRequestInfoText("");
  }

  async function submitRequestInfo() {
    if (!selectedAgent || !requestInfoText.trim()) {
      setError("Please provide information about what is needed.");
      return;
    }

    try {
      setProcessing(selectedAgent.id);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to request information.");
      }

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          action: "request-info",
          notes: requestInfoText.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to request information");
      }

      // Show success message
      const agentName = selectedAgent?.full_name || 'Agent';
      setSuccess({ message: `Information request has been sent to ${agentName}.`, type: 'needs-info' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

      setShowRequestInfoModal(false);
      setSelectedAgent(null);
      setRequestInfoText("");
      await loadPendingAgents();
    } catch (err: any) {
      console.error("Error requesting info:", err);
      setError(err.message || "Failed to request information. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'needs-info':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Show the profession they picked in create-account (same labels as the dropdown)
  const getSpecialtyLabel = (agent: PendingAgent): string => {
    const meta = agent.metadata || {};
    if (meta.specialty && typeof meta.specialty === 'string') return meta.specialty;
    const role = meta.agent_role;
    if (role === 'lawyer') return 'Lawyer';
    if (role === 'insurance-broker') return 'Insurance Agent';
    if (role === 'financial-advisor') return 'Financial Advisor';
    return 'Funeral Planner';
  };

  // Convert agents to specialists format for display
  const specialists: Specialist[] = pendingAgents.map((agent) => {
    // Single unified approval status
    const status = agent.approval_status || 'pending';
    
    return {
      id: agent.id,
      name: agent.full_name || 'Unknown',
      company: agent.funeral_home || 'N/A',
      region: agent.notification_cities && agent.notification_cities.length > 0
        ? `${agent.notification_cities[0].city}, ${agent.notification_cities[0].province}`
        : 'N/A',
      specialty: getSpecialtyLabel(agent),
      email: agent.email || 'N/A',
      submittedDate: new Date(agent.created_at).toISOString().split('T')[0],
      status: status as 'pending' | 'approved' | 'rejected' | 'needs-info',
      documents: [
        { name: 'License Verification', uploaded: agent.licensed_in_province },
        { name: 'Funeral Director License', uploaded: agent.licensed_funeral_director },
        { name: 'Business Registration', uploaded: !!agent.funeral_home },
        { name: 'Profile Bio', uploaded: !!agent.ai_generated_bio },
      ],
      notes: agent.approval_notes || '',
      tags: [],
      bio: agent.ai_generated_bio || null,
      bioStatus: agent.bio_approval_status || null,
      profileStatus: agent.approval_status || null,
    };
  });

  const pendingCount = specialists.filter(s => s.status === 'pending').length;
  const needsInfoCount = specialists.filter(s => s.status === 'needs-info').length;

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-600">Loading approvals...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-black">Approvals</h1>
        <p className="text-neutral-600">Review and approve pending specialist applications</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
          success.type === 'approve' 
            ? 'border-neutral-200 bg-neutral-50 text-neutral-700'
            : success.type === 'decline'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-orange-200 bg-orange-50 text-orange-700'
        }`}>
          <div className="flex items-center gap-2">
            {success.type === 'approve' && <Check className="w-5 h-5" />}
            {success.type === 'decline' && <X className="w-5 h-5" />}
            {success.type === 'needs-info' && <AlertCircle className="w-5 h-5" />}
            <span>{success.message}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600 mb-1">Pending Review</p>
          <p className="text-3xl text-black">{pendingCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600 mb-1">Needs Info</p>
          <p className="text-3xl text-orange-600">{needsInfoCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600 mb-1">Approved Today</p>
          <p className="text-3xl text-neutral-700">0</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600 mb-1">Avg. Review Time</p>
          <p className="text-3xl text-black">—</p>
        </div>
      </div>

      {/* Applications Queue */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Specialist</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {specialists.map((specialist) => (
                <tr key={specialist.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-black">{specialist.name}</p>
                      <p className="text-sm text-neutral-600">{specialist.company}</p>
                      <p className="text-xs text-neutral-500">{specialist.email}</p>
                      {specialist.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {specialist.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{specialist.region}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{specialist.specialty}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {specialist.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {doc.uploaded ? (
                            <>
                              <Check className="w-4 h-4 text-neutral-700" />
                              <span className="text-neutral-700">{doc.name}</span>
                              {doc.name === 'Profile Bio' && specialist.bio ? (
                                <button 
                                  onClick={() => {
                                    const bioText = specialist.bio || '';
                                    const escapedBio = bioText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                    modal.innerHTML = `
                                      <div class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
                                        <h3 class="text-lg font-semibold mb-4">Profile Bio for ${specialist.name}</h3>
                                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                                          <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">${escapedBio}</p>
                                        </div>
                                        <div class="flex gap-2">
                                          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Close</button>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(modal);
                                    modal.querySelector('button')?.addEventListener('click', () => modal.remove());
                                    // Close on background click
                                    modal.addEventListener('click', (e) => {
                                      if (e.target === modal) modal.remove();
                                    });
                                  }}
                                  className="text-neutral-700 hover:text-neutral-800"
                                  title="View Profile Bio"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      const agent = pendingAgents.find(a => a.id === specialist.id);
                                      if (!agent) return;
                                      
                                      // Get document info from metadata
                                      const metadata = agent.metadata || {};
                                      const certificates = metadata.certificates_licenses || [];
                                      
                                      // Determine which document to show
                                      let docInfo: any = null;
                                      if (doc.name === 'License Verification' && agent.licensed_in_province) {
                                        docInfo = certificates.find((c: any) => c.type === 'province_license' || c.type === 'license');
                                      } else if (doc.name === 'Funeral Director License' && agent.licensed_funeral_director) {
                                        docInfo = certificates.find((c: any) => c.type === 'funeral_director' || c.type === 'director_license');
                                      } else if (doc.name === 'Business Registration' && agent.funeral_home) {
                                        docInfo = metadata.business_registration || metadata.business_documents || null;
                                      }
                                      
                                      // Show document info modal
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                      
                                      let content = '';
                                      const escapedDocName = doc.name.replace(/"/g, '&quot;');
                                      
                                      if (docInfo) {
                                        if (docInfo.url || docInfo.file_url) {
                                          const docUrl = docInfo.url || docInfo.file_url;
                                          const docName = (docInfo.name || doc.name).replace(/"/g, '&quot;');
                                          const docNumber = docInfo.number ? docInfo.number.replace(/"/g, '&quot;') : '';
                                          const docIssuer = docInfo.issuer ? docInfo.issuer.replace(/"/g, '&quot;') : '';
                                          const docExpiry = docInfo.expiry ? docInfo.expiry.replace(/"/g, '&quot;') : '';
                                          
                                          content = `
                                            <div class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
                                              <h3 class="text-lg font-semibold mb-4">${escapedDocName}</h3>
                                              <div class="space-y-4">
                                                ${docInfo.name ? `<p class="text-sm text-gray-600"><strong>Name:</strong> ${docName}</p>` : ''}
                                                ${docInfo.number ? `<p class="text-sm text-gray-600"><strong>Number:</strong> ${docNumber}</p>` : ''}
                                                ${docInfo.issuer ? `<p class="text-sm text-gray-600"><strong>Issuer:</strong> ${docIssuer}</p>` : ''}
                                                ${docInfo.expiry ? `<p class="text-sm text-gray-600"><strong>Expiry:</strong> ${docExpiry}</p>` : ''}
                                                <div class="flex gap-3 pt-4 border-t">
                                                  <a href="${docUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-800 text-sm inline-flex items-center gap-2">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                    View Document
                                                  </a>
                                                  <a href="${docUrl}" download class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm inline-flex items-center gap-2">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    Download
                                                  </a>
                                                </div>
                                              </div>
                                              <button onclick="this.closest('.fixed').remove()" class="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Close</button>
                                            </div>
                                          `;
                                        } else {
                                          // Show document info without file
                                          const docName = docInfo.name ? docInfo.name.replace(/"/g, '&quot;') : '';
                                          const docNumber = docInfo.number ? docInfo.number.replace(/"/g, '&quot;') : '';
                                          const docIssuer = docInfo.issuer ? docInfo.issuer.replace(/"/g, '&quot;') : '';
                                          const docExpiry = docInfo.expiry ? docInfo.expiry.replace(/"/g, '&quot;') : '';
                                          
                                          content = `
                                            <div class="bg-white rounded-lg p-6 max-w-2xl">
                                              <h3 class="text-lg font-semibold mb-4">${escapedDocName}</h3>
                                              <div class="space-y-2">
                                                ${docInfo.name ? `<p class="text-sm text-gray-600"><strong>Name:</strong> ${docName}</p>` : ''}
                                                ${docInfo.number ? `<p class="text-sm text-gray-600"><strong>Number:</strong> ${docNumber}</p>` : ''}
                                                ${docInfo.issuer ? `<p class="text-sm text-gray-600"><strong>Issuer:</strong> ${docIssuer}</p>` : ''}
                                                ${docInfo.expiry ? `<p class="text-sm text-gray-600"><strong>Expiry:</strong> ${docExpiry}</p>` : ''}
                                                <p class="text-sm text-gray-500 italic mt-4">Document file not available</p>
                                              </div>
                                              <button onclick="this.closest('.fixed').remove()" class="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Close</button>
                                            </div>
                                          `;
                                        }
                                      } else {
                                        // No document info available
                                        content = `
                                          <div class="bg-white rounded-lg p-6 max-w-2xl">
                                            <h3 class="text-lg font-semibold mb-4">${escapedDocName}</h3>
                                            <p class="text-sm text-gray-600">Document information not available. This may indicate the document was verified through other means or is pending upload.</p>
                                            <button onclick="this.closest('.fixed').remove()" class="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Close</button>
                                          </div>
                                        `;
                                      }
                                      
                                      modal.innerHTML = content;
                                      document.body.appendChild(modal);
                                      modal.querySelector('button')?.addEventListener('click', () => modal.remove());
                                      modal.addEventListener('click', (e) => {
                                        if (e.target === modal) modal.remove();
                                      });
                                    }}
                                    className="text-neutral-700 hover:text-neutral-800"
                                    title="View Document"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const agent = pendingAgents.find(a => a.id === specialist.id);
                                      if (!agent) return;
                                      
                                      const metadata = agent.metadata || {};
                                      const certificates = metadata.certificates_licenses || [];
                                      
                                      let docInfo: any = null;
                                      if (doc.name === 'License Verification' && agent.licensed_in_province) {
                                        docInfo = certificates.find((c: any) => c.type === 'province_license' || c.type === 'license');
                                      } else if (doc.name === 'Funeral Director License' && agent.licensed_funeral_director) {
                                        docInfo = certificates.find((c: any) => c.type === 'funeral_director' || c.type === 'director_license');
                                      } else if (doc.name === 'Business Registration' && agent.funeral_home) {
                                        docInfo = metadata.business_registration || metadata.business_documents || null;
                                      }
                                      
                                      if (docInfo && (docInfo.url || docInfo.file_url)) {
                                        const docUrl = docInfo.url || docInfo.file_url;
                                        const link = document.createElement('a');
                                        link.href = docUrl;
                                        link.download = docInfo.name || doc.name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } else {
                                        alert('Document file not available for download');
                                      }
                                    }}
                                    className="text-neutral-700 hover:text-neutral-800"
                                    title="Download Document"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-500" />
                              <span className="text-neutral-400">{doc.name}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${getStatusColor(specialist.status)}`}>
                      {specialist.status === 'needs-info' && <AlertCircle className="w-3 h-3" />}
                      {specialist.status === 'pending' && <Clock className="w-3 h-3" />}
                      {specialist.status.replace('-', ' ')}
                    </span>
                    {specialist.notes && (
                      <p className="text-xs text-neutral-500 mt-1 italic">"{specialist.notes}"</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{specialist.submittedDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const agent = pendingAgents.find(a => a.id === specialist.id);
                          if (agent) setSelectedAgent(agent);
                        }}
                        className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1"
                        title="View Full Submission"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {specialists.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-600">
                    No pending applications
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Rules */}
      <div className="mt-8 bg-neutral-50 border border-neutral-200 rounded-lg p-6">
        <h3 className="text-lg mb-3 text-black">Approval Rules</h3>
        <ul className="space-y-2 text-sm text-neutral-700">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-neutral-700 mt-0.5" />
            <span>All required documents must be uploaded and valid</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-neutral-700 mt-0.5" />
            <span>Email domain should match company domain (optional verification)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-neutral-700 mt-0.5" />
            <span>Region and specialty must match Soradin coverage areas</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-neutral-700 mt-0.5" />
            <span>License verification through state board (manual check)</span>
          </li>
        </ul>
      </div>

      {/* View Submission Modal */}
      {selectedAgent && !showRequestInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-black">Agent Submission Review</h2>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-1">{selectedAgent.full_name || 'Unknown Agent'}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Information */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Full Name</p>
                    <p className="text-sm text-neutral-900">{selectedAgent.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Email</p>
                    <p className="text-sm text-neutral-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedAgent.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Phone</p>
                    <p className="text-sm text-neutral-900 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedAgent.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Business / Firm Name{((selectedAgent.metadata as any)?.business_names?.length > 1) ? "s" : ""}</p>
                    <p className="text-sm text-neutral-900 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {(() => {
                        const names = (selectedAgent.metadata as any)?.business_names;
                        if (Array.isArray(names) && names.length > 0) {
                          return (
                            <span className="flex flex-col gap-0.5">
                              {names.map((n: string, i: number) => (
                                <span key={i}>{n || "—"}</span>
                              ))}
                            </span>
                          );
                        }
                        return selectedAgent.funeral_home || (selectedAgent.metadata as any)?.business_name || "N/A";
                      })()}
                    </p>
                  </div>
                  {selectedAgent.job_title && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Professional Title</p>
                      <p className="text-sm text-neutral-900">{selectedAgent.job_title}</p>
                    </div>
                  )}
                  {/* Home Address from create-account (metadata.address) */}
                  {(() => {
                    const addr = (selectedAgent.metadata as any)?.address;
                    if (addr && (addr.street || addr.city || addr.province || addr.postalCode)) {
                      return (
                        <div className="col-span-2">
                          <p className="text-xs text-neutral-500 mb-1">Home Address</p>
                          <p className="text-sm text-neutral-900">
                            {[addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Role-specific credentials (all create-account fields for approval) */}
              {(() => {
                const metadata = selectedAgent.metadata || {};
                const role = (metadata.agent_role || '').toLowerCase().trim();
                const isInsurance = role === 'insurance-broker' || role === 'financial_insurance_agent';
                const isFinancial = role === 'financial-advisor' || role === 'financial_insurance_agent';
                const hasRole = role === 'funeral-planner' || role === 'lawyer' || isInsurance || isFinancial;
                if (!hasRole) return null;
                const na = (v: unknown) => (v !== undefined && v !== null && v !== '' ? String(v) : 'N/A');
                return (
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Credentials
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {role === 'funeral-planner' && (
                        <>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Licensed or employed by licensed funeral establishment</p>
                            <p className="text-sm text-neutral-900">
                              {metadata.licensed_or_employed_funeral === true || metadata.licensed_or_employed_funeral === 'yes' ? 'Yes' : (metadata.licensed_or_employed_funeral === false || metadata.licensed_or_employed_funeral === 'no' ? 'No' : 'N/A')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Regulator name</p>
                            <p className="text-sm text-neutral-900">{na(metadata.regulator_name)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-neutral-500 mb-1">Pre-need products sold</p>
                            <p className="text-sm text-neutral-900">
                              {[
                                metadata.pre_need_purple_shield === true || metadata.pre_need_purple_shield === 'yes' ? 'Purple Shield' : null,
                                metadata.pre_need_trustage === true || metadata.pre_need_trustage === 'yes' ? 'Trustage' : null,
                                (metadata.pre_need_other === true || metadata.pre_need_other === 'yes') && metadata.pre_need_other_specify ? `Other: ${metadata.pre_need_other_specify}` : (metadata.pre_need_other === true || metadata.pre_need_other === 'yes' ? 'Other' : null),
                              ].filter(Boolean).join(', ') || 'N/A'}
                            </p>
                          </div>
                          {(metadata.trustage_enroller_number != null || metadata.llqp_license != null) && (
                            <>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">TruStage Enroller Number (legacy)</p>
                                <p className="text-sm text-neutral-900">
                                  {metadata.trustage_enroller_number === true || metadata.trustage_enroller_number === 'yes' ? 'Yes' : 'No'}
                                </p>
                              </div>
                              {(metadata.trustage_enroller_number === true || metadata.trustage_enroller_number === 'yes') && (metadata.trustage_enroller_number_value || metadata.trustage_enrollee_number) && (
                                <div>
                                  <p className="text-xs text-neutral-500 mb-1">TruStage Enrolee Number</p>
                                  <p className="text-sm text-neutral-900">{metadata.trustage_enroller_number_value || metadata.trustage_enrollee_number}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">LLQP License (legacy)</p>
                                <p className="text-sm text-neutral-900">
                                  {metadata.llqp_license === true || metadata.llqp_license === 'yes' ? 'Yes' : 'No'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">LLQP Valid in Quebec (legacy)</p>
                                <p className="text-sm text-neutral-900 capitalize">{metadata.llqp_quebec || 'N/A'}</p>
                              </div>
                            </>
                          )}
                        </>
                      )}
                      {role === 'lawyer' && (
                        <>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">License / Member Number</p>
                            <p className="text-sm text-neutral-900">{na(metadata.law_society_license_number)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Law Society Name</p>
                            <p className="text-sm text-neutral-900">{na(metadata.law_society_name)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Authorized Provinces</p>
                            <p className="text-sm text-neutral-900">{na(metadata.authorized_provinces)}</p>
                          </div>
                        </>
                      )}
                      {isInsurance && (
                        <>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Licensed in Canada</p>
                            <p className="text-sm text-neutral-900">{metadata.licensed_in_canada === true || metadata.licensed_in_canada === 'yes' ? 'Yes' : (metadata.licensed_in_canada === false || metadata.licensed_in_canada === 'no' ? 'No' : 'N/A')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">License Number</p>
                            <p className="text-sm text-neutral-900">{na(metadata.license_number)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Regulatory Body</p>
                            <p className="text-sm text-neutral-900">{na(metadata.regulatory_body)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-neutral-500 mb-1">Brokerage / MGA / Sponsoring Organization</p>
                            <p className="text-sm text-neutral-900">{na(metadata.brokerage_mga)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">E&amp;O Coverage</p>
                            <p className="text-sm text-neutral-900">{metadata.eo_coverage === true || metadata.eo_coverage === 'yes' ? 'Yes' : (metadata.eo_coverage === false || metadata.eo_coverage === 'no' ? 'No' : 'N/A')}</p>
                          </div>
                          {metadata.licensing_province != null && (
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">Licensing Province</p>
                              <p className="text-sm text-neutral-900">{String(metadata.licensing_province)}</p>
                            </div>
                          )}
                          {(metadata.has_multiple_provinces === true || metadata.has_multiple_provinces === 'yes') && (
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">Additional Provinces</p>
                              <p className="text-sm text-neutral-900">{na(metadata.additional_provinces)}</p>
                            </div>
                          )}
                        </>
                      )}
                      {isFinancial && (
                        <>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Regulatory Organization</p>
                            <p className="text-sm text-neutral-900">{na(metadata.regulatory_organization)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">License / Registration Number</p>
                            <p className="text-sm text-neutral-900">{na(metadata.license_registration_number)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Registered Provinces</p>
                            <p className="text-sm text-neutral-900">{na(metadata.registered_provinces)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">E&amp;O / Professional Liability Coverage</p>
                            <p className="text-sm text-neutral-900">{metadata.eo_insurance_confirmed === true || metadata.eo_insurance_confirmed === 'yes' ? 'Yes' : (metadata.eo_insurance_confirmed === false || metadata.eo_insurance_confirmed === 'no' ? 'No' : 'N/A')}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Office Locations (create-account) */}
              {(() => {
                const offices = (selectedAgent as PendingAgent).office_locations;
                if (!offices || offices.length === 0) return null;
                return (
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Office Locations
                    </h3>
                    <div className="space-y-3">
                      {offices.map((loc, idx) => (
                        <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <p className="font-medium text-neutral-900">{loc.name}</p>
                          <p className="text-sm text-neutral-600">
                            {[loc.street_address, loc.city, loc.province, loc.postal_code].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Profile Bio */}
              {selectedAgent.ai_generated_bio && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Profile Bio</h3>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {selectedAgent.ai_generated_bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => handleApprove(selectedAgent.id)}
                  disabled={processing === selectedAgent.id}
                  className="flex-1 px-4 py-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-800 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedAgent.id)}
                  disabled={processing === selectedAgent.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={() => {
                    setShowRequestInfoModal(true);
                  }}
                  disabled={processing === selectedAgent.id}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertCircle className="w-4 h-4" />
                  Request More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request More Info Modal */}
      {showRequestInfoModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-black">Request More Information</h2>
              <p className="text-sm text-neutral-600 mt-1">What information does {selectedAgent.full_name || 'this agent'} need to provide?</p>
            </div>
            <div className="p-6">
              <textarea
                value={requestInfoText}
                onChange={(e) => setRequestInfoText(e.target.value)}
                placeholder="Please specify what additional information or documents are needed for approval..."
                className="w-full h-32 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>
            <div className="p-6 border-t border-neutral-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRequestInfoModal(false);
                  setRequestInfoText("");
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitRequestInfo}
                disabled={!requestInfoText.trim() || processing === selectedAgent.id}
                className="px-4 py-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-800 text-sm disabled:opacity-50"
              >
                {processing === selectedAgent.id ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
