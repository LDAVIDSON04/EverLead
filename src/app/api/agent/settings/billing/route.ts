import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { DateTime } from "luxon";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = user.id;
    const pricePerAppointment = 0.01; // TEMP: set to $0.01 as requested

    // Get agent's timezone from profile
    let agentTimezone = "America/Vancouver"; // Default
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("metadata, agent_province")
      .eq("id", agentId)
      .maybeSingle();
    
    if (profileData?.metadata?.timezone) {
      agentTimezone = profileData.metadata.timezone;
    } else if (profileData?.metadata?.availability?.timezone) {
      agentTimezone = profileData.metadata.availability.timezone;
    } else if (profileData?.agent_province) {
      const province = profileData.agent_province.toUpperCase();
      if (province === "BC" || province === "BRITISH COLUMBIA") {
        agentTimezone = "America/Vancouver";
      } else if (province === "AB" || province === "ALBERTA") {
        agentTimezone = "America/Edmonton";
      } else if (province === "SK" || province === "SASKATCHEWAN") {
        agentTimezone = "America/Regina";
      } else if (province === "MB" || province === "MANITOBA") {
        agentTimezone = "America/Winnipeg";
      } else if (province === "ON" || province === "ONTARIO") {
        agentTimezone = "America/Toronto";
      } else if (province === "QC" || province === "QUEBEC") {
        agentTimezone = "America/Montreal";
      }
    }

    // Get current month appointments (booked/confirmed appointments)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { count: currentMonthAppointments } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .in("status", ["booked", "confirmed"])
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    // Get all paid appointments (appointments with price_cents set, indicating successful payment)
    const { data: pastAppointments } = await supabaseAdmin
      .from("appointments")
      .select("id, created_at, price_cents, status")
      .eq("agent_id", agentId)
      .not("price_cents", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    // Group by day (using agent's timezone)
    const paymentsByDay: Record<string, { appointments: number; amount: number; ids: string[] }> = {};
    (pastAppointments || []).forEach((apt: any) => {
      // Parse UTC timestamp and convert to agent's timezone
      const utcDate = DateTime.fromISO(apt.created_at, { zone: "utc" });
      const localDate = utcDate.setZone(agentTimezone);
      // Create a day key in format "YYYY-MM-DD" for grouping (in agent's timezone)
      const dayKey = localDate.toISODate() || localDate.toFormat('yyyy-MM-dd');
      
      if (!dayKey) return; // Skip if date parsing failed
      
      if (!paymentsByDay[dayKey]) {
        paymentsByDay[dayKey] = { appointments: 0, amount: 0, ids: [] };
      }
      paymentsByDay[dayKey].appointments++;
      paymentsByDay[dayKey].amount += apt.price_cents / 100;
      paymentsByDay[dayKey].ids.push(apt.id);
    });

    // Convert to array with formatted dates, sorted by date (most recent first)
    const pastPayments = Object.entries(paymentsByDay)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Sort descending (newest first)
      .map(([dayKey, data]) => {
        // Parse UTC date string and convert to agent's timezone
        const utcDate = DateTime.fromISO(`${dayKey}T00:00:00.000Z`, { zone: "utc" });
        const localDate = utcDate.setZone(agentTimezone);
        const formattedDate = localDate.toLocaleString({
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        
        return {
          id: data.ids[0], // Use first appointment ID as the row ID
          date: formattedDate,
          appointments: data.appointments,
          amount: `$${data.amount.toFixed(2)}`,
          status: "Paid",
        };
      });

    return NextResponse.json({
      pricePerAppointment,
      currentMonthAppointments: currentMonthAppointments || 0,
      currentMonthTotal: ((currentMonthAppointments || 0) * pricePerAppointment).toFixed(2),
      pastPayments,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/billing:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
