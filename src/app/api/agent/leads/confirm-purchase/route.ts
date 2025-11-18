// src/app/api/agent/leads/confirm-purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, leadId } = await request.json();

    if (!sessionId || !leadId) {
      return NextResponse.json(
        { error: "Missing sessionId or leadId" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe session for verification
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status !== "paid" &&
      session.status !== "complete"
    ) {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // If we set metadata.leadId earlier, optionally verify it matches.
    if (session.metadata?.leadId && session.metadata.leadId !== leadId) {
      console.warn("leadId mismatch between payload and metadata", {
        payloadLeadId: leadId,
        metadataLeadId: session.metadata.leadId,
      });
    }

    // Get customer email from Stripe session to find the agent
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      console.error("No customer email in Stripe session");
      return NextResponse.json(
        { error: "Could not identify customer from payment" },
        { status: 400 }
      );
    }

    // Find the agent by email from Stripe customer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, email")
      .eq("email", customerEmail)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Error finding profile by email:", profileError);
      return NextResponse.json(
        { error: "Could not find agent account. Please ensure your account email matches your Stripe payment email." },
        { status: 404 }
      );
    }

    if (profile.role !== "agent") {
      return NextResponse.json(
        { error: "Account is not an agent account" },
        { status: 403 }
      );
    }

    const agentId = profile.id;

    const amountCents =
      typeof session.amount_total === "number" ? session.amount_total : null;

    // Check if lead is still available
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("status, assigned_agent_id")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // If lead is already purchased, return success (idempotent)
    if (lead.status === "purchased_by_agent" && lead.assigned_agent_id === agentId) {
      return NextResponse.json({ ok: true, lead: { id: leadId, already_purchased: true } });
    }

    // Mark the lead as purchased for this agent
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        status: "purchased_by_agent",
        assigned_agent_id: agentId,
        purchased_by_email: customerEmail, // Save agent's email from Stripe
        price_charged_cents: amountCents,
        purchased_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating lead as purchased", updateError);
      return NextResponse.json(
        { error: "Failed to assign lead after purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, lead: updatedLead });
  } catch (err) {
    console.error("confirm-purchase fatal error", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while confirming purchase. Payment succeeded but assignment failed.",
      },
      { status: 500 }
    );
  }
}

