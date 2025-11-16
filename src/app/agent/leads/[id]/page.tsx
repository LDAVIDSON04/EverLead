"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";

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
  preferred_contact_time: string | null;
  budget_range: string | null;
  notes_from_family: string | null;
  assigned_agent_id: string | null;
};

type LeadNote = {
  id: string;
  content: string;
  created_at: string;
  agent_id: string;
};

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
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error(error);
          setLeadError("Failed to load lead.");
          setLeadLoading(false);
          return;
        }

        if (!data) {
          setLeadError("Lead not found.");
          setLeadLoading(false);
          return;
        }

        // Optional: basic access check (only owner or new)
        if (
          data.assigned_agent_id &&
          data.assigned_agent_id !== user.id
        ) {
          setLeadError("This lead is assigned to another agent.");
          setLeadLoading(false);
          return;
        }

        setLead(data as Lead);
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

        setNotes(body.notes || []);
      } catch (err) {
        console.error(err);
        setNotesError("Unexpected error loading notes.");
      } finally {
        setNotesLoading(false);
      }
    }

    loadNotes();
  }, [id]);

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
      setNotes((prev) => [...prev, saved]);
      setNewNote("");
    } catch (err) {
      console.error(err);
      setNotesError("Unexpected error saving note.");
    } finally {
      setSavingNote(false);
    }
  }

  const displayName =
    lead?.full_name ||
    (lead?.first_name || lead?.last_name
      ? [lead?.first_name, lead?.last_name].filter(Boolean).join(" ")
      : "Unnamed lead");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Agent portal
            </span>
          </div>
        </div>
      </header>

      <AgentNav />

      <section className="mx-auto max-w-5xl px-4 py-6">
        {leadLoading ? (
          <p className="text-sm text-slate-600">Loading lead…</p>
        ) : leadError ? (
          <p className="text-sm text-red-600">{leadError}</p>
        ) : !lead ? (
          <p className="text-sm text-slate-600">Lead not found.</p>
        ) : (
          <>
            {/* Header row */}
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {displayName}
                </h1>
                <p className="text-xs text-slate-500">
                  {formatUrgency(lead.urgency_level)} •{" "}
                  {lead.city || "Unknown city"}
                  {lead.province ? `, ${lead.province}` : ""} • Created{" "}
                  {formatDateTime(lead.created_at)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Lead summary card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  Lead summary
                </h2>
                <dl className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="font-medium">
                      {lead.status || "Unknown"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Service type</dt>
                    <dd className="font-medium">
                      {lead.service_type || "Pre-need planning"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium">
                      {lead.city || "Unknown"}
                      {lead.province ? `, ${lead.province}` : ""}
                    </dd>
                  </div>
                  {lead.budget_range && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Budget</dt>
                      <dd className="font-medium">
                        {lead.budget_range}
                      </dd>
                    </div>
                  )}
                  {lead.preferred_contact_time && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">
                        Preferred contact time
                      </dt>
                      <dd className="font-medium">
                        {lead.preferred_contact_time}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Contact details */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  Contact details
                </h2>
                <dl className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium">{displayName}</dd>
                  </div>
                  {lead.email && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="font-medium break-all">
                        {lead.email}
                      </dd>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Phone</dt>
                      <dd className="font-medium">
                        {lead.phone}
                      </dd>
                    </div>
                  )}
                </dl>

                {lead.notes_from_family && (
                  <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Notes from family
                    </div>
                    <p>{lead.notes_from_family}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes section */}
            <div className="mt-5 grid gap-4 md:grid-cols-[2fr,1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  Your notes
                </h2>

                <form onSubmit={handleAddNote} className="mb-3 space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    placeholder="Log a call, email, or next step for this family…"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
                      className="ml-auto rounded-full bg-brand-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingNote ? "Saving…" : "Add note"}
                    </button>
                  </div>
                </form>

                {notesLoading ? (
                  <p className="text-xs text-slate-600">
                    Loading notes…
                  </p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-slate-600">
                    You haven&apos;t added any notes for this lead yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-2"
                      >
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
                          {formatDateTime(note.created_at)}
                        </div>
                        <p>{note.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">
                  Next steps
                </h2>
                <p className="mb-2">
                  Use notes to track every touchpoint: first call, voicemail,
                  follow-up, and when the plan is closed.
                </p>
                <p>
                  Over time you&apos;ll be able to see which types of leads
                  convert best and how many touches it usually takes.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

