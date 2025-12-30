import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

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

    // Get profile with approval status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, approval_status, metadata, email")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only check onboarding if agent is approved
    if (profile.approval_status !== "approved") {
      return NextResponse.json({
        needsOnboarding: false,
        hasPaymentMethod: false,
        hasAvailability: false,
      });
    }

    // Check for availability in metadata
    const metadata = profile.metadata || {};
    const availabilityData = metadata.availability || {};
    const hasAvailability = 
      availabilityData.locations && 
      Array.isArray(availabilityData.locations) && 
      availabilityData.locations.length > 0 &&
      availabilityData.availabilityByLocation &&
      Object.keys(availabilityData.availabilityByLocation).length > 0;

    // Check for payment method via Stripe
    // First, try to find Stripe customer by email
    let hasPaymentMethod = false;
    try {
      if (profile.email) {
        const customers = await stripe.customers.list({
          email: profile.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          // Check if customer has payment methods
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card',
          });

          hasPaymentMethod = paymentMethods.data.length > 0;
        }
      }
    } catch (stripeError: any) {
      console.error("Error checking Stripe payment methods:", stripeError);
      // If Stripe check fails, assume no payment method (safer default)
      hasPaymentMethod = false;
    }

    const needsOnboarding = !hasPaymentMethod || !hasAvailability;

    return NextResponse.json({
      needsOnboarding,
      hasPaymentMethod,
      hasAvailability,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/onboarding-status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

