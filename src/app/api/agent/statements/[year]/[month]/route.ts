// API endpoint to fetch monthly statement data for an agent
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const { year: yearParam, month: monthParam } = await params;
    const year = parseInt(yearParam);
    const month = parseInt(monthParam);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid year or month" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    
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

    const userId = user.id;

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .eq("role", "agent")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 403 }
      );
    }

    // Calculate start and end dates for the month (UTC)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Fetch all appointments with charges for this month
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("id, created_at, price_cents, stripe_payment_intent_id")
      .eq("agent_id", userId)
      .not("price_cents", "is", null)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch statement data" },
        { status: 500 }
      );
    }

    // Group appointments by date (day)
    const dailyCharges = new Map<string, { count: number; totalCents: number; dayNum: number }>();

    appointments?.forEach((appt: { id: string; created_at: string; price_cents: number | null; stripe_payment_intent_id: string | null }) => {
      const date = new Date(appt.created_at);
      const dayNum = date.getUTCDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayKey = `${monthNames[month - 1]} ${dayNum}`;
      
      if (!dailyCharges.has(dayKey)) {
        dailyCharges.set(dayKey, { count: 0, totalCents: 0, dayNum });
      }
      
      const daily = dailyCharges.get(dayKey)!;
      daily.count += 1;
      daily.totalCents += appt.price_cents || 0;
    });

    // Convert to array format for frontend
    const transactions = Array.from(dailyCharges.entries())
      .map(([date, data]) => ({
        date,
        description: "Soradin Appointments",
        quantity: data.count.toString(),
        paidCents: data.totalCents,
        paid: (data.totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }))
      .sort((a, b) => {
        // Sort by day number
        const dayA = dailyCharges.get(a.date)?.dayNum || 0;
        const dayB = dailyCharges.get(b.date)?.dayNum || 0;
        return dayA - dayB;
      });

    // Calculate total
    const totalCents = transactions.reduce((sum, t) => sum + t.paidCents, 0);
    const total = (totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Get agent info for statement
    const { data: agentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, first_name, last_name")
      .eq("id", userId)
      .single();

    const agentName = agentProfile?.full_name || 
      (agentProfile?.first_name && agentProfile?.last_name 
        ? `${agentProfile.first_name} ${agentProfile.last_name}`
        : "Agent");

    // Get payment method for account number display
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    let accountNumber = "N/A";
    
    if (authUser?.email) {
      // Try to get Stripe customer and payment method
      try {
        const stripe = (await import("@/lib/stripe")).stripe;
        const customers = await stripe.customers.list({
          email: authUser.email,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customers.data[0].id,
            type: 'card',
            limit: 1,
          });
          
          if (paymentMethods.data.length > 0) {
            accountNumber = `****-****-${paymentMethods.data[0].card?.last4 || "****"}`;
          }
        }
      } catch (e) {
        console.error("Error fetching payment method:", e);
      }
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return NextResponse.json({
      year,
      month,
      monthName: monthNames[month - 1],
      agentName,
      accountNumber,
      statementPeriod: {
        from: `${monthNames[month - 1]} 1, ${year}`,
        to: `${monthNames[month - 1]} ${endDate.getDate()}, ${year}`,
        statementDate: `${monthNames[month - 1]} ${endDate.getDate()}, ${year}`,
      },
      transactions,
      total,
      totalCents,
      transactionCount: appointments?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching statement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch statement" },
      { status: 500 }
    );
  }
}

