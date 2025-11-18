// src/app/api/agent/leads/confirm-purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, leadId } = await request.json();

    if (!sessionId || !leadId) {
      console.error("confirm-purchase: Missing required parameters", { sessionId: !!sessionId, leadId: !!leadId });
      return NextResponse.json(
        { error: "Missing payment session information. Please contact support with your payment confirmation." },
        { status: 400 }
      );
    }

    // Retrieve the Stripe session for verification with expanded payment intent
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
    } catch (stripeError: any) {
      console.error("confirm-purchase: Stripe session retrieval failed", stripeError);
      return NextResponse.json(
        { error: "Could not verify payment. Please contact support with your payment confirmation email." },
        { status: 400 }
      );
    }

    // Verify payment status - must be paid
    if (session.payment_status !== "paid") {
      console.warn("confirm-purchase: Payment not completed", {
        sessionId,
        payment_status: session.payment_status,
        status: session.status,
      });
      return NextResponse.json(
        { error: "Payment not completed. Please complete your payment or contact support if you've already paid." },
        { status: 400 }
      );
    }

    // Verify metadata.leadId matches (use metadata if payload doesn't match)
    const metadataLeadId = session.metadata?.leadId;
    const finalLeadId = metadataLeadId || leadId;
    
    if (metadataLeadId && metadataLeadId !== leadId) {
      console.warn("confirm-purchase: leadId mismatch, using metadata", {
        payloadLeadId: leadId,
        metadataLeadId,
      });
    }

    // Get customer email from Stripe session to find the agent
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      console.error("confirm-purchase: No customer email in Stripe session", {
        sessionId,
        hasCustomerEmail: !!session.customer_email,
        hasCustomerDetails: !!session.customer_details,
      });
      return NextResponse.json(
        { 
          error: "Payment succeeded, but we couldn't identify your account. Please contact support with your payment confirmation email and the time of payment.",
          details: "Missing customer email in payment session"
        },
        { status: 400 }
      );
    }

    // Find the agent by email from Stripe customer
    let profile;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, role, email")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileError) {
        console.error("confirm-purchase: Error querying profiles", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("confirm-purchase: Profile not found for email", customerEmail);
        return NextResponse.json(
          { 
            error: "Payment succeeded, but we couldn't find your agent account. Please ensure your account email matches your Stripe payment email, or contact support.",
            details: `No profile found for email: ${customerEmail}`
          },
          { status: 404 }
        );
      }

      profile = profileData;
    } catch (dbError: any) {
      console.error("confirm-purchase: Database error finding profile", dbError);
      return NextResponse.json(
        { 
          error: "Payment succeeded, but we had trouble accessing your account. Please contact support with your payment confirmation email.",
          details: "Database error while finding agent profile"
        },
        { status: 500 }
      );
    }

    if (profile.role !== "agent") {
      console.warn("confirm-purchase: Account is not an agent", { email: customerEmail, role: profile.role });
      return NextResponse.json(
        { 
          error: "Payment succeeded, but your account is not an agent account. Please contact support.",
          details: "Account role mismatch"
        },
        { status: 403 }
      );
    }

    const agentId = profile.id;

    const amountCents =
      typeof session.amount_total === "number" ? session.amount_total : null;

    // Verify price matches (optional but good for security)
    const metadataPriceCents = session.metadata?.priceCents 
      ? parseInt(session.metadata.priceCents, 10) 
      : null;
    if (metadataPriceCents && amountCents && metadataPriceCents !== amountCents) {
      console.warn("confirm-purchase: Price mismatch", {
        metadataPrice: metadataPriceCents,
        sessionAmount: amountCents,
      });
      // Continue anyway - use session amount as source of truth
    }

    // Check if lead exists and get current status
    let lead;
    try {
      const { data: leadData, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("id, status, assigned_agent_id, buy_now_price_cents")
        .eq("id", finalLeadId)
        .maybeSingle();

      if (leadError) {
        console.error("confirm-purchase: Error fetching lead", leadError);
        throw leadError;
      }

      if (!leadData) {
        console.error("confirm-purchase: Lead not found", { leadId: finalLeadId });
        return NextResponse.json(
          { 
            error: "Payment succeeded, but the lead you purchased could not be found. Please contact support with your payment confirmation.",
            details: `Lead ${finalLeadId} not found in database`
          },
          { status: 404 }
        );
      }

      lead = leadData;
    } catch (dbError: any) {
      console.error("confirm-purchase: Database error fetching lead", dbError);
      return NextResponse.json(
        { 
          error: "Payment succeeded, but we had trouble accessing the lead. Please contact support with your payment confirmation email.",
          details: "Database error while fetching lead"
        },
        { status: 500 }
      );
    }

    // Idempotency check: If lead is already purchased by this agent, return success
    if (lead.status === "purchased_by_agent" && lead.assigned_agent_id === agentId) {
      console.log("confirm-purchase: Lead already purchased by this agent (idempotent)", {
        leadId: finalLeadId,
        agentId,
      });
      return NextResponse.json({ 
        ok: true, 
        lead: { id: finalLeadId, already_purchased: true },
        message: "Lead was already assigned to you"
      });
    }

    // If lead is purchased by someone else, this is an error
    if (lead.status === "purchased_by_agent" && lead.assigned_agent_id !== agentId) {
      console.error("confirm-purchase: Lead already purchased by another agent", {
        leadId: finalLeadId,
        currentAgentId: lead.assigned_agent_id,
        purchasingAgentId: agentId,
      });
      return NextResponse.json(
        { 
          error: "Payment succeeded, but this lead was already purchased by another agent. Please contact support for a refund.",
          details: "Lead already assigned to different agent"
        },
        { status: 409 }
      );
    }

    // Mark the lead as purchased for this agent (atomic update)
    try {
      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from("leads")
        .update({
          status: "purchased_by_agent",
          assigned_agent_id: agentId,
          purchased_by_email: customerEmail, // Save agent's email from Stripe
          price_charged_cents: amountCents,
          purchased_at: new Date().toISOString(),
        })
        .eq("id", finalLeadId)
        .select()
        .single();

      if (updateError) {
        console.error("confirm-purchase: Error updating lead as purchased", updateError);
        return NextResponse.json(
          { 
            error: "Payment succeeded, but we had trouble saving your purchase. Please contact support with your payment confirmation email and the time of payment.",
            details: updateError.message || "Database update failed"
          },
          { status: 500 }
        );
      }

      if (!updatedLead) {
        console.error("confirm-purchase: Update succeeded but no lead returned", { leadId: finalLeadId });
        return NextResponse.json(
          { 
            error: "Payment succeeded, but we couldn't confirm the lead assignment. Please contact support.",
            details: "Update query returned no data"
          },
          { status: 500 }
        );
      }

      console.log("confirm-purchase: Successfully assigned lead", {
        leadId: finalLeadId,
        agentId,
        amountCents,
      });

      return NextResponse.json({ 
        ok: true, 
        lead: updatedLead,
        message: "Lead successfully assigned"
      });
    } catch (updateError: any) {
      console.error("confirm-purchase: Fatal error updating lead", updateError);
      return NextResponse.json(
        { 
          error: "Payment succeeded, but we had trouble saving your purchase. Please contact support with your payment confirmation email and the time of payment.",
          details: updateError.message || "Unexpected error during database update"
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    // Catch-all for any unexpected errors
    console.error("confirm-purchase: Fatal error", err);
    return NextResponse.json(
      {
        error: "Payment succeeded, but we encountered an unexpected error while processing your purchase. Please contact support with your payment confirmation email and the time of payment.",
        details: err.message || "Unexpected server error"
      },
      { status: 500 }
    );
  }
}

