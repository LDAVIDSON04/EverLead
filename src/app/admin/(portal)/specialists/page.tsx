"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Search, Calendar, Eye, UserX, User, Building, MapPin, Mail, Phone, Clock, CalendarCheck, X } from "lucide-react";
import Image from "next/image";

type OfficeLocation = {
  id: string;
  city: string;
  province: string;
  name: string;
};

type SpecialistRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  funeral_home: string | null;
  region: string | null;
  regions: string[]; // All locations
  specialty: string | null;
  calendar_google: boolean;
  calendar_microsoft: boolean;
  status: string | null;
  created_at: string;
  total_appointments: number;
  phone: string | null;
  agent_city: string | null;
  agent_province: string | null;
  metadata: any;
  office_locations: OfficeLocation[];
  profile_picture_url: string | null;
};

export default function AdminSpecialistsPage() {
  useRequireRole("admin");

  const [specialists, setSpecialists] = useState<SpecialistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Get only approved agents from profiles table (only agents visible to families)
        const { data: profilesData, error: profilesError } = await supabaseClient
          .from("profiles")
          .select("id, full_name, email, phone, funeral_home, agent_city, agent_province, approval_status, created_at, metadata, profile_picture_url")
          .eq("role", "agent")
          .eq("approval_status", "approved")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Get emails from auth.users for agents that don't have email in profiles
        const agentIds = (profilesData || []).map((p: any) => p.id);
        
        // Fetch emails from auth.users for agents without email in profiles
        let emailsFromAuth: Record<string, string | null> = {};
        if (agentIds.length > 0) {
          try {
            const emailResponse = await fetch("/api/admin/agents/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentIds }),
            });
            if (emailResponse.ok) {
              const emailData = await emailResponse.json();
              emailsFromAuth = emailData.emails || {};
            }
          } catch (emailErr) {
            console.error("Error fetching emails from auth.users:", emailErr);
            // Continue without emails - not critical
          }
        }
        let calendarByAgent: Record<string, { google: boolean; microsoft: boolean }> = {};
        let appointmentsByAgent: Record<string, number> = {};
        let officeLocationsByAgent: Record<string, OfficeLocation[]> = {};

        if (agentIds.length > 0) {
          // Get calendar connections (uses specialist_id which is the agent's user id)
          const { data: connections } = await supabaseClient
            .from("calendar_connections")
            .select("specialist_id, provider")
            .in("specialist_id", agentIds);

          (connections || []).forEach((c: any) => {
            if (!calendarByAgent[c.specialist_id]) {
              calendarByAgent[c.specialist_id] = { google: false, microsoft: false };
            }
            if (c.provider === "google") calendarByAgent[c.specialist_id].google = true;
            if (c.provider === "microsoft") calendarByAgent[c.specialist_id].microsoft = true;
          });

          // Get appointment counts for each agent
          const { data: appointmentsData } = await supabaseClient
            .from("appointments")
            .select("agent_id")
            .in("agent_id", agentIds);

          (appointmentsData || []).forEach((apt: any) => {
            appointmentsByAgent[apt.agent_id] = (appointmentsByAgent[apt.agent_id] || 0) + 1;
          });

          // Get all office locations for each agent
          const { data: officeLocationsData } = await supabaseClient
            .from("office_locations")
            .select("id, agent_id, city, province, name")
            .in("agent_id", agentIds)
            .order("display_order", { ascending: true });
          
          (officeLocationsData || []).forEach((loc: any) => {
            if (!officeLocationsByAgent[loc.agent_id]) {
              officeLocationsByAgent[loc.agent_id] = [];
            }
            officeLocationsByAgent[loc.agent_id].push({
              id: loc.id,
              city: loc.city,
              province: loc.province,
              name: loc.name,
            });
          });
        }

        const rows: SpecialistRow[] = (profilesData || []).map((profile: any) => {
          const metadata = profile.metadata || {};
          const specialty = metadata.specialty || null;
          
          // Get office locations for this agent
          const officeLocations = officeLocationsByAgent[profile.id] || [];
          
          // Build list of all regions/locations
          const regions: string[] = [];
          
          // Add office locations first
          officeLocations.forEach((loc) => {
            const locationStr = `${loc.city}, ${loc.province}`;
            if (!regions.includes(locationStr)) {
              regions.push(locationStr);
            }
          });
          
          // Add default location if not already in list
          if (profile.agent_city && profile.agent_province) {
            const defaultLocation = `${profile.agent_city}, ${profile.agent_province}`;
            if (!regions.includes(defaultLocation)) {
              regions.push(defaultLocation);
            }
          } else if (profile.agent_province) {
            if (!regions.includes(profile.agent_province)) {
              regions.push(profile.agent_province);
            }
          }
          
          // Primary region for display (first one or fallback)
          const region = regions.length > 0 ? regions[0] : (profile.agent_city && profile.agent_province
            ? `${profile.agent_city}, ${profile.agent_province}`
            : profile.agent_province || profile.agent_city || null);

          // Get email from profile first, fallback to auth.users
          const email = profile.email || emailsFromAuth[profile.id] || null;

          return {
            id: profile.id,
            display_name: profile.full_name || null,
            email: email,
            phone: profile.phone || null,
            funeral_home: profile.funeral_home || null,
            region: region,
            regions: regions, // All locations
            specialty: specialty,
            status: profile.approval_status || "approved", // Should always be approved since we filter
            calendar_google: calendarByAgent[profile.id]?.google ?? false,
            calendar_microsoft: calendarByAgent[profile.id]?.microsoft ?? false,
            created_at: profile.created_at,
            total_appointments: appointmentsByAgent[profile.id] || 0,
            agent_city: profile.agent_city,
            agent_province: profile.agent_province,
            metadata: metadata,
            office_locations: officeLocations,
            profile_picture_url: profile.profile_picture_url || null,
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
    // All agents shown are approved, but we can filter by other criteria if needed
    // For now, all statuses show all approved agents
    if (statusFilter === "active" && s.status !== "approved") return false;
    if (statusFilter === "suspended" && s.status === "approved") return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.display_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.funeral_home?.toLowerCase().includes(q) ||
      s.region?.toLowerCase().includes(q) ||
      s.specialty?.toLowerCase().includes(q)
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
          <option value="all">All Approved Agents</option>
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
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {specialist.regions && specialist.regions.length > 0 ? (
                        specialist.regions.map((loc, idx) => (
                          <div key={idx} className="text-sm text-neutral-700">
                            {loc}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </div>
                  </td>
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
                      <button 
                        onClick={() => setSelectedSpecialist(specialist)}
                        className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      {specialist.status !== "approved" && (
                        <button className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Activate
                        </button>
                      )}
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

      {/* View Specialist Modal */}
      {selectedSpecialist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-black">Agent Details</h2>
                <button
                  onClick={() => setSelectedSpecialist(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-1">{selectedSpecialist.display_name || 'Unknown Agent'}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Agent Information */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Agent Information
                </h3>
                {/* Profile Picture */}
                {selectedSpecialist.profile_picture_url && (
                  <div className="mb-4">
                    <p className="text-xs text-neutral-500 mb-2">Profile Picture</p>
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-200">
                      <Image
                        src={selectedSpecialist.profile_picture_url}
                        alt={selectedSpecialist.display_name || 'Agent'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Full Name</p>
                    <p className="text-sm text-neutral-900">{selectedSpecialist.display_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Email</p>
                    <p className="text-sm text-neutral-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedSpecialist.email || 'N/A'}
                    </p>
                  </div>
                  {selectedSpecialist.phone && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Phone</p>
                      <p className="text-sm text-neutral-900 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {selectedSpecialist.phone}
                      </p>
                    </div>
                  )}
                  {selectedSpecialist.funeral_home && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Funeral Home</p>
                      <p className="text-sm text-neutral-900 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {selectedSpecialist.funeral_home}
                      </p>
                    </div>
                  )}
                  {selectedSpecialist.regions && selectedSpecialist.regions.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-neutral-500 mb-1">Service Locations</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSpecialist.regions.map((loc, idx) => (
                          <span key={idx} className="text-sm text-neutral-900 flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded">
                            <MapPin className="w-3 h-3" />
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedSpecialist.specialty && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Specialty</p>
                      <p className="text-sm text-neutral-900">{selectedSpecialist.specialty}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" />
                  Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 mb-1">Total Appointments</p>
                    <p className="text-2xl font-semibold text-neutral-900">{selectedSpecialist.total_appointments}</p>
                    <p className="text-xs text-neutral-500 mt-1">Booked through Soradin</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 mb-1">Member Since</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {new Date(selectedSpecialist.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {(() => {
                        const created = new Date(selectedSpecialist.created_at);
                        const now = new Date();
                        const months = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
                        const years = Math.floor(months / 12);
                        const remainingMonths = months % 12;
                        if (years > 0) {
                          return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
                        }
                        return `${months} month${months !== 1 ? 's' : ''}`;
                      })()} on platform
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 mb-1">Status</p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSpecialist.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedSpecialist.status === "needs-info"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedSpecialist.status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calendar Integrations */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Calendar Integrations
                </h3>
                <div className="flex gap-4">
                  {selectedSpecialist.calendar_google ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm text-emerald-700 font-medium">Google Calendar</span>
                      <span className="text-xs text-emerald-600">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-500">Google Calendar</span>
                      <span className="text-xs text-neutral-400">Not connected</span>
                    </div>
                  )}
                  {selectedSpecialist.calendar_microsoft ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">Microsoft Calendar</span>
                      <span className="text-xs text-blue-600">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-500">Microsoft Calendar</span>
                      <span className="text-xs text-neutral-400">Not connected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSelectedSpecialist(null)}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
