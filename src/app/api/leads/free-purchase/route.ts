// src/app/api/leads/free-purchase/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leadId = body.leadId as string | undefined;
    const agentId = body.agentId as string | undefined;

    if (!leadId || !agentId) {
      return NextResponse.json(
        { error: "Missing leadId or agentId" },
        { status: 400 }
      );
    }

    // 1) Check profile and free flag
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("first_free_redeemed, agent_province")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error(profileError);
      return NextResponse.json(
        { error: "PROFILE_NOT_FOUND" },
        { status: 400 }
      );
    }

    // Get email from auth.users (email is not in profiles table)
    let agentEmail: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
      agentEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.error("Error fetching agent email from auth.users:", authError);
      // Continue without email
    }

    if (profile.first_free_redeemed) {
      // Not eligible for free lead anymore
      return NextResponse.json(
        { error: "FIRST_LEAD_ALREADY_USED" },
        { status: 409 }
      );
    }

    // 2) Check lead is still new and validate province match
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("status, province")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError || !lead) {
      console.error(leadError);
      return NextResponse.json(
        { error: "LEAD_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (lead.status !== "new") {
      return NextResponse.json(
        { error: "LEAD_NOT_AVAILABLE" },
        { status: 400 }
      );
    }

    // Validate province match - agents can only purchase leads from their province
    if (profile.agent_province) {
      const agentProvinceUpper = (profile.agent_province || '').toUpperCase().trim();
      const leadProvinceUpper = (lead.province || '').toUpperCase().trim();
      
      if (leadProvinceUpper !== agentProvinceUpper) {
        return NextResponse.json(
          { 
            error: `You can only purchase leads from ${profile.agent_province}. This lead is from ${lead.province || 'another province'}.` 
          },
          { status: 403 }
        );
      }
    }

    // 3) Mark lead as purchased by this agent, with price 0
    const { error: updateLeadError } = await supabaseAdmin
      .from("leads")
      .update({
        status: "purchased_by_agent",
        assigned_agent_id: agentId,
        purchased_by_email: agentEmail, // Save agent's email
        price_charged_cents: 0,
        purchased_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateLeadError) {
      console.error(updateLeadError);
      return NextResponse.json(
        { error: "FAILED_TO_UPDATE_LEAD" },
        { status: 500 }
      );
    }

    // 4) Flip free flag
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_free_redeemed: true,
      })
      .eq("id", agentId);

    if (updateProfileError) {
      console.error(updateProfileError);
      return NextResponse.json(
        { error: "FAILED_TO_UPDATE_PROFILE" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}



