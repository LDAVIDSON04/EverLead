"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Search, Calendar, Eye, UserX } from "lucide-react";

type SpecialistRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  funeral_home: string | null;
  region: string | null;
  specialty: string | null;
  calendar_google: boolean;
  calendar_microsoft: boolean;
  status: string | null;
};

export default function AdminSpecialistsPage() {
  useRequireRole("admin");

  const [specialists, setSpecialists] = useState<SpecialistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // First get specialists
        const { data: specialistsData, error: specialistsError } = await supabaseClient
          .from("specialists")
          .select("id, display_name, status, funeral_home, region, specialty");

        if (specialistsError) throw specialistsError;

        // Then get profiles for those specialist IDs
        const specialistIds = (specialistsData || []).map((s: any) => s.id);
        let profilesMap: Record<string, any> = {};
        
        if (specialistIds.length > 0) {
          const { data: profilesData } = await supabaseClient
            .from("profiles")
            .select("id, email, full_name")
            .in("id", specialistIds);
          
          (profilesData || []).forEach((profile: any) => {
            profilesMap[profile.id] = profile;
          });
        }

        const data = specialistsData;
        const error = null;

        if (error) throw error;

        const ids = (data || []).map((s: any) => s.id);
        let calendarBySpecialist: Record<string, { google: boolean; microsoft: boolean }> = {};

        if (ids.length > 0) {
          const { data: connections } = await supabaseClient
            .from("calendar_connections")
            .select("specialist_id, provider")
            .in("specialist_id", ids);

          (connections || []).forEach((c: any) => {
            if (!calendarBySpecialist[c.specialist_id]) {
              calendarBySpecialist[c.specialist_id] = { google: false, microsoft: false };
            }
            if (c.provider === "google") calendarBySpecialist[c.specialist_id].google = true;
            if (c.provider === "microsoft") calendarBySpecialist[c.specialist_id].microsoft = true;
          });
        }

        const rows: SpecialistRow[] = (data || []).map((s: any) => {
          const profile = profilesMap[s.id];
          return {
            id: s.id,
            display_name: s.display_name || profile?.full_name || null,
            email: profile?.email || null,
            funeral_home: s.funeral_home,
            region: s.region,
            specialty: s.specialty,
            status: s.status,
            calendar_google: calendarBySpecialist[s.id]?.google ?? false,
            calendar_microsoft: calendarBySpecialist[s.id]?.microsoft ?? false,
          };
        });

        setSpecialists(rows);
      } catch (err: any) {
        console.error("Error loading specialists:", err);
        setError(err.message || "Failed to load specialists");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = specialists.filter((s) => {
    if (statusFilter === "active" && s.status !== "approved") return false;
    if (statusFilter === "suspended" && s.status === "approved") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.display_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.funeral_home?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-600">Loading specialists…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-black">Specialists</h1>
        <p className="text-neutral-600">Manage active specialists</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Specialists Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Calendar</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((specialist) => (
                <tr key={specialist.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-black">{specialist.display_name || "Unknown"}</p>
                      <p className="text-sm text-neutral-600">{specialist.funeral_home || "—"}</p>
                      <p className="text-xs text-neutral-500">{specialist.email || "—"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{specialist.region || "—"}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{specialist.specialty || "—"}</td>
                  <td className="px-6 py-4">
                    {specialist.calendar_google && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <span className="text-sm text-emerald-700">Google</span>
                      </div>
                    )}
                    {specialist.calendar_microsoft && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">Microsoft</span>
                      </div>
                    )}
                    {!specialist.calendar_google && !specialist.calendar_microsoft && (
                      <span className="text-sm text-neutral-400">Not connected</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs ${
                        specialist.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {specialist.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1">
                        <UserX className="w-3 h-3" />
                        {specialist.status === "approved" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-600">
                    No specialists found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
