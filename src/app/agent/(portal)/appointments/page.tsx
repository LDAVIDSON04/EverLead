import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import AvailableAppointments from './AvailableAppointments';

type LeadSummary = {
  id: string;
  city: string | null;
  province: string | null;
  age: number | null;
  service_type: string | null;
  urgency_level: string | null;
  region: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  lead_id: string;
  leads: LeadSummary | null;
};

export default async function AgentAppointmentsPage() {
  // Get user ID from auth token in cookies
  const cookieStore = await cookies();
  
  // Try to get user from auth token - Supabase stores it in a specific cookie format
  // We'll use supabaseAdmin to verify the user, but first get the token
  const allCookies = cookieStore.getAll();
  let userId: string | null = null;
  
  // Try to find Supabase auth cookie
  for (const cookie of allCookies) {
    if (cookie.name.includes('auth-token') || cookie.name.includes('supabase-auth-token')) {
      // Extract user ID from JWT token (simplified - in production use proper JWT parsing)
      try {
        const tokenParts = cookie.value.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          userId = payload.sub || payload.user_id || null;
          break;
        }
      } catch {
        // If parsing fails, continue
      }
    }
  }
  
  if (!userId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-gray-600">You must be logged in as an agent.</p>
      </div>
    );
  }

  if (!supabaseAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-red-600">Server configuration error.</p>
      </div>
    );
  }

  // 1) Verify user exists
  const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !authUser?.user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-gray-600">You must be logged in as an agent.</p>
      </div>
    );
  }

  // 2) Get agent profile with home_region
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, home_region')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-red-600">
          Could not load your profile. Please contact support.
        </p>
      </div>
    );
  }

  const homeRegion = profile.home_region;

  if (!homeRegion) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold mb-2">Available Appointments</h1>
        <p className="text-sm text-gray-700">
          You don&apos;t have a region set yet. Please contact Soradin to confirm
          your territory.
        </p>
      </div>
    );
  }

  // 3) Fetch pending appointments in this agent's region
  // First, get all lead IDs in this region
  const { data: regionLeads, error: leadsError } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('region', homeRegion);
  
  if (leadsError) {
    console.error('Error fetching leads by region:', leadsError);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-red-600">
          Error loading appointments. Please try again later.
        </p>
      </div>
    );
  }
  
  const regionLeadIds = (regionLeads || []).map((lead: any) => lead.id);
  
  if (regionLeadIds.length === 0) {
    // No leads in this region, so no appointments
    return (
      <div className="w-full">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Available Appointments
          </h1>
          <p className="text-xs text-gray-600">
            Showing appointments in your region: <span className="font-medium capitalize">{homeRegion}</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6b6b6b]">
            No available appointments in your region right now. Check back soon.
          </p>
        </div>
      </div>
    );
  }
  
  // Now fetch appointments for these leads
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id,
      requested_date,
      requested_window,
      status,
      lead_id,
      leads (
        id,
        city,
        province,
        age,
        service_type,
        urgency_level,
        region
      )
    `)
    .eq('status', 'pending')
    .is('agent_id', null)
    .in('lead_id', regionLeadIds) // Filter by lead IDs in this region
    .order('requested_date', { ascending: true });

  if (error) {
    console.error(error);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Available Appointments</h1>
        <p className="text-sm text-red-600">
          Error loading appointments. Please try again later.
        </p>
      </div>
    );
  }

  // Transform data to match Appointment type (leads comes as array from Supabase join)
  const appointments = (data || []).map((item: any) => ({
    ...item,
    leads: Array.isArray(item.leads) ? item.leads[0] || null : item.leads || null,
  })) as Appointment[];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-normal text-[#2a2a2a]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Available Appointments
        </h1>
        <p className="text-xs text-gray-600">
          Showing appointments in your region: <span className="font-medium capitalize">{homeRegion}</span>
        </p>
      </div>

      {!appointments.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6b6b6b]">
            No available appointments in your region right now. Check back soon.
          </p>
        </div>
      ) : (
        <AvailableAppointments appointments={appointments} />
      )}
    </div>
  );
}

