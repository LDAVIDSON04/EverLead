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
    const pricePerAppointment = 0.01; // Testing price - change back to 29.0 for production

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
      .select("created_at, price_cents, status")
      .eq("agent_id", agentId)
      .not("price_cents", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    // Group by month
    const paymentsByMonth: Record<string, { appointments: number; amount: number }> = {};
    (pastAppointments || []).forEach((apt: any) => {
      const date = new Date(apt.created_at);
      const monthKey = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = { appointments: 0, amount: 0 };
      }
      paymentsByMonth[monthKey].appointments++;
      paymentsByMonth[monthKey].amount += apt.price_cents / 100;
    });

    const pastPayments = Object.entries(paymentsByMonth).map(([date, data]) => ({
      date,
      appointments: data.appointments,
      amount: `$${data.amount.toFixed(2)}`,
      status: "Paid",
    }));

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
