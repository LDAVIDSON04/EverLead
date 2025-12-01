"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { agentOwnsLead } from "@/lib/leads";
import { maskName, maskEmail, maskPhone } from "@/lib/masking";

type Lead = {
  id: string;
  created_at: string | null;
  status: string | null;
  urgency_level: string | null;
  service_type: string | null;
  city: string | null;
  province: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  age: number | null;
  planning_for: string | null;
  ceremony_preferences: string | null;
  timeline_intent: string | null;
  preferred_contact_time: string | null;
  additional_notes: string | null;
  notes_from_family: string | null;
  assigned_agent_id: string | null;
  agent_status?: string | null; // For agent's workflow status
  remains_disposition: string | null;
  service_celebration: string | null;
  family_pre_arranged: string | null;
};

type LeadNote = {
  id: string;
  content: string;
  created_at: string;
  agent_id: string;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: 'morning' | 'afternoon' | 'evening';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_followup", label: "In follow-up" },
  { value: "closed_won", label: "Closed – won" },
  { value: "closed_lost", label: "Closed – lost" },
];

export default function LeadDetailsPage() {
  useRequireRole("agent");

  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);

  const [agentStatus, setAgentStatus] = useState<string>("new");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);

  // Load lead + user
  useEffect(() => {
    async function loadLead() {
      if (!id) return;

      setLeadLoading(true);
      setLeadError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError) {
          console.error(userError);
          setLeadError("Failed to load user.");
          setLeadLoading(false);
          return;
        }

        if (!user) {
          router.push("/agent");
          return;
        }

        setUserId(user.id);

        // TODO: in a future pass, restrict contact fields at the API level
        // so non-owning agents never receive full PII (name, email, phone).
        // For now, we mask these fields in the UI.
        const { data, error } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error loading lead:", error);
          setLeadError("Failed to load lead.");
          setLeadLoading(false);
          return;
        }

        if (!data) {
          setLeadError("Lead not found.");
          setLeadLoading(false);
          return;
        }

        // Debug: Log the data to see what fields are available
        console.log("Lead data loaded:", {
          id: data.id,
          has_remains_disposition: !!data.remains_disposition,
          has_service_celebration: !!data.service_celebration,
          has_family_pre_arranged: !!data.family_pre_arranged,
          remains_disposition: data.remains_disposition,
          service_celebration: data.service_celebration,
          family_pre_arranged: data.family_pre_arranged,
          all_keys: Object.keys(data),
        });

        // Access check: allow if lead is assigned to this agent OR if agent has an appointment for this lead
        const isAssignedToAgent = data.assigned_agent_id === user.id;
        
        // Check if agent has an appointment for this lead
        let hasAppointment = false;
        if (!isAssignedToAgent) {
          const { data: appointmentData } = await supabaseClient
            .from('appointments')
            .select('id')
            .eq('lead_id', id)
            .eq('agent_id', user.id)
            .maybeSingle();
          
          hasAppointment = !!appointmentData;
        }

        if (
          data.assigned_agent_id &&
          data.assigned_agent_id !== user.id &&
          !hasAppointment
        ) {
          setLeadError("This lead is assigned to another agent.");
          setLeadLoading(false);
          return;
        }

        const leadData = data as Lead;
        setLead(leadData);
        // Use agent_status if available, otherwise default to "new"
        setAgentStatus(leadData.agent_status || "new");
      } catch (err) {
        console.error(err);
        setLeadError("Unexpected error loading lead.");
      } finally {
        setLeadLoading(false);
      }
    }

    loadLead();
  }, [id, router]);

  // Load notes
  useEffect(() => {
    async function loadNotes() {
      if (!id) return;

      setNotesLoading(true);
      setNotesError(null);

      try {
        const res = await fetch(`/api/leads/${id}/notes`);
        const body = await res.json();

        if (!res.ok) {
          console.error("Notes fetch error:", body);
          setNotesError(body?.error || "Failed to load notes.");
          setNotesLoading(false);
          return;
        }

        setNotes((body.notes || []).reverse()); // Newest first
      } catch (err) {
        console.error(err);
        setNotesError("Unexpected error loading notes.");
      } finally {
        setNotesLoading(false);
      }
    }

    loadNotes();
  }, [id]);

  // Load appointment
  useEffect(() => {
    async function loadAppointment() {
      if (!id) return;

      setAppointmentLoading(true);

      try {
        const { data, error } = await supabaseClient
          .from('appointments')
          .select('*')
          .eq('lead_id', id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading appointment:', error);
          // Don't show error - appointment might not exist
        } else {
          setAppointment(data);
        }
      } catch (err) {
        console.error('Unexpected error loading appointment:', err);
      } finally {
        setAppointmentLoading(false);
      }
    }

    loadAppointment();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!id || !userId) return;
    setSavingStatus(true);
    setStatusSaved(false);

    try {
      const { error } = await supabaseClient
        .from("leads")
        .update({ agent_status: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Status update error:", error);
        return;
      }

      setAgentStatus(newStatus);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !userId || !newNote.trim()) return;

    setSavingNote(true);
    setNotesError(null);

    try {
      const res = await fetch(`/api/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote.trim(),
          agentId: userId,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        console.error("Note save error:", body);
        setNotesError(body?.error || "Failed to save note.");
        setSavingNote(false);
        return;
      }

      const saved = body.note as LeadNote;
      setNotes((prev) => [saved, ...prev]); // Add to top
      setNewNote("");
    } catch (err) {
      console.error(err);
      setNotesError("Unexpected error saving note.");
    } finally {
      setSavingNote(false);
    }
  }

  function formatUrgency(u: string | null) {
    if (!u) return "Unknown";
    const lower = u.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return u;
  }

  function formatDateTime(d: string | null) {
    if (!d) return "Unknown";
    try {
      const date = new Date(d);
      return date.toLocaleString();
    } catch {
      return d;
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "Unknown";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  }

  function formatTimelineIntent(intent: string | null) {
    if (!intent) return "Not specified";
    if (intent === "ready_now") return "I'm ready to plan soon";
    if (intent === "speak_with_family") return "I need to speak with my family first";
    if (intent === "collecting_info_need_done") return "I'm gathering information right now";
    if (intent === "collecting_info_unsure") return "I'm planning for the future";
    if (intent === "unsure") return "Not sure yet";
    // Legacy values for backward compatibility
    if (intent === "purchase_now") return "Ready to purchase now";
    if (intent === "talk_to_someone") return "Wants to talk to someone";
    if (intent === "just_browsing") return "Just browsing / exploring";
    return intent;
  }

  function formatRemainsDisposition(disposition: string | null) {
    if (!disposition) return "Not specified";
    if (disposition === "scatter_cremated_remains") return "Scatter cremated remains";
    if (disposition === "keep_remains") return "Keep remains";
    if (disposition === "burial_at_cemetery") return "Burial at cemetery";
    if (disposition === "unsure") return "Unsure";
    return disposition;
  }

  function formatServiceCelebration(celebration: string | null) {
    if (!celebration) return "Not specified";
    if (celebration === "yes") return "Yes";
    if (celebration === "no") return "No";
    if (celebration === "unsure") return "Unsure";
    return celebration;
  }

  function formatFamilyPreArranged(preArranged: string | null) {
    if (!preArranged) return "Not specified";
    if (preArranged === "yes") return "Yes";
    if (preArranged === "no") return "No";
    if (preArranged === "unsure") return "Unsure";
    return preArranged;
  }

  function formatPlanningFor(planning: string | null) {
    if (!planning) return "Not specified";
    if (planning === "myself") return "Myself";
    if (planning === "spouse_partner") return "Spouse / Partner";
    if (planning === "parent") return "Parent";
    if (planning === "other_family") return "Other family member";
    return planning;
  }

  // Determine if agent owns this lead
  const owns = lead && userId ? agentOwnsLead(lead, userId) : false;

  // Apply masking if agent doesn't own the lead
  const rawDisplayName =
    lead?.full_name ||
    (lead?.first_name || lead?.last_name
      ? [lead?.first_name, lead?.last_name].filter(Boolean).join(" ")
      : "Unnamed lead");
  
  const displayName = owns ? rawDisplayName : maskName(rawDisplayName);
  const displayEmail = owns ? lead?.email : (lead?.email ? maskEmail(lead.email) : null);
  const displayPhone = owns ? lead?.phone : (lead?.phone ? maskPhone(lead.phone) : null);

  return (
    <>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={owns ? "/agent/leads/mine" : "/agent/leads/available"}
          className="mb-4 inline-flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
        >
          ← Back to {owns ? "my leads" : "available leads"}
        </Link>

        {leadLoading ? (
          <p className="text-sm text-[#6b6b6b]">Loading lead…</p>
        ) : leadError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{leadError}</p>
          </div>
        ) : !lead ? (
          <p className="text-sm text-[#6b6b6b]">Lead not found.</p>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1
                className="mb-2 text-2xl font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Lead details
              </h1>
              <p className="text-sm text-[#6b6b6b]">
                Pre-need inquiry from {displayName || lead.city || "Unknown"}
              </p>
            </div>

            {/* Main grid */}
            <div className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
              {/* Left column */}
              <div className="space-y-4">
                {/* Family information */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                  <h2
                    className="mb-3 text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Family information
                  </h2>
                  <dl className="space-y-2 text-sm">
                    {displayName && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Name
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">{displayName}</dd>
                      </div>
                    )}
                    {(lead.city || lead.province) && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Location
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {lead.city || ""}
                          {lead.city && lead.province ? ", " : ""}
                          {lead.province || ""}
                        </dd>
                      </div>
                    )}
                    {lead.age && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Age
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">{lead.age}</dd>
                      </div>
                    )}
                    {displayEmail && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Email
                        </dt>
                        <dd className="mt-1 break-all text-[#2a2a2a]">
                          {owns ? (
                            <a
                              href={`mailto:${lead?.email}`}
                              className="text-[#2a2a2a] hover:underline"
                            >
                              {displayEmail}
                            </a>
                          ) : (
                            <span>{displayEmail}</span>
                          )}
                        </dd>
                      </div>
                    )}
                    {displayPhone && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Phone
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {owns ? (
                            <a
                              href={`tel:${lead?.phone}`}
                              className="text-[#2a2a2a] hover:underline"
                            >
                              {displayPhone}
                            </a>
                          ) : (
                            <span>{displayPhone}</span>
                          )}
                        </dd>
                      </div>
                    )}
                    {!owns && (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-[11px] text-amber-900">
                          🔒 Purchase this lead to reveal full contact details.
                        </p>
                      </div>
                    )}
                    {lead.preferred_contact_time && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Preferred contact time
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {lead.preferred_contact_time}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Appointment request */}
                {appointment && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-800 shadow-sm">
                    <h2
                      className="mb-3 text-base font-normal text-[#2a2a2a]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      📅 Appointment Request
                    </h2>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Requested Date
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a] font-medium">
                          {formatDate(appointment.requested_date)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Preferred Time
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a] capitalize">
                          {appointment.requested_window}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Status
                        </dt>
                        <dd className="mt-1">
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            Pending
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Planning details */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                  <h2
                    className="mb-3 text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Planning details
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        Urgency
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            lead.urgency_level === "hot"
                              ? "bg-red-100 text-red-900"
                              : lead.urgency_level === "warm"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          {formatUrgency(lead.urgency_level)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        Service type
                      </dt>
                      <dd className="mt-1 text-[#2a2a2a]">
                        {lead.service_type === "cremation"
                          ? "Cremation"
                          : lead.service_type === "burial"
                          ? "Burial"
                          : lead.service_type === "unsure"
                          ? "Unsure"
                          : lead.service_type || "Not specified"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        What will the family do with the remains?
                      </dt>
                      <dd className="mt-1 text-[#2a2a2a]">
                        {formatRemainsDisposition(lead.remains_disposition)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        Would there be a service celebration of life, memorial event?
                      </dt>
                      <dd className="mt-1 text-[#2a2a2a]">
                        {formatServiceCelebration(lead.service_celebration)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        Has anyone else in your family had a pre-arranged funeral plan?
                      </dt>
                      <dd className="mt-1 text-[#2a2a2a]">
                        {formatFamilyPreArranged(lead.family_pre_arranged)}
                      </dd>
                    </div>
                    {lead.planning_for && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Planning for
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {formatPlanningFor(lead.planning_for)}
                        </dd>
                      </div>
                    )}
                    {lead.timeline_intent && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          How soon after you have more information do you expect to put your plan in place?
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {formatTimelineIntent(lead.timeline_intent)}
                        </dd>
                      </div>
                    )}
                    {lead.ceremony_preferences && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Ceremony preferences
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {lead.ceremony_preferences}
                        </dd>
                      </div>
                    )}
                    {lead.additional_notes && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Additional details
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a] whitespace-pre-wrap">
                          {lead.additional_notes}
                        </dd>
                      </div>
                    )}
                    {lead.notes_from_family && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Notes from family
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a] whitespace-pre-wrap">
                          {lead.notes_from_family}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                        Created
                      </dt>
                      <dd className="mt-1 text-[#2a2a2a]">
                        {formatDate(lead.created_at)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Lead status */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                  <h2
                    className="mb-3 text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Lead status
                  </h2>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#4a4a4a]">
                      Status
                    </label>
                    <select
                      value={agentStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={savingStatus}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {statusSaved && (
                      <p className="text-[10px] text-green-600">Saved</p>
                    )}
                  </div>
                </div>

                {/* Private notes */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                  <h2
                    className="mb-3 text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Notes
                  </h2>

                  <form onSubmit={handleAddNote} className="mb-3 space-y-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      placeholder="Log a call, email, or next step for this family…"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <div className="flex items-center justify-between">
                      {notesError && (
                        <p className="text-[11px] text-red-600">
                          {notesError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={savingNote || !newNote.trim()}
                        className="ml-auto rounded-full bg-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                      >
                        {savingNote ? "Saving…" : "Add note"}
                      </button>
                    </div>
                  </form>

                  {notesLoading ? (
                    <p className="text-xs text-[#6b6b6b]">Loading notes…</p>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-[#6b6b6b]">
                      You haven&apos;t added any notes for this lead yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800"
                        >
                          <p>{note.content}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            Added {formatDateTime(note.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
