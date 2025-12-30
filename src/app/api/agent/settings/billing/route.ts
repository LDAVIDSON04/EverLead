import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

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
    const pricePerAppointment = 0.50; // Testing price - Stripe minimum is $0.50, change to 29.0 for production

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

    // Group by day
    const paymentsByDay: Record<string, { appointments: number; amount: number; ids: string[] }> = {};
    (pastAppointments || []).forEach((apt: any) => {
      const date = new Date(apt.created_at);
      // Create a day key in format "YYYY-MM-DD" for grouping
      const dayKey = date.toISOString().split('T')[0];
      
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
        const date = new Date(dayKey);
        const formattedDate = date.toLocaleDateString("en-US", {
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
