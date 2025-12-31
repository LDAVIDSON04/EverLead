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
    
    // Check that availability has locations AND at least one location has time slots enabled
    const locations = availabilityData.locations || [];
    const availabilityByLocation = availabilityData.availabilityByLocation || {};
    
    let hasAvailability = false;
    if (locations.length > 0 && Object.keys(availabilityByLocation).length > 0) {
      // Check if at least one location has at least one day enabled
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      hasAvailability = Object.keys(availabilityByLocation).some((locationKey) => {
        const locationSchedule = availabilityByLocation[locationKey];
        return days.some((day: string) => {
          const dayData = locationSchedule[day];
          return dayData && dayData.enabled === true;
        });
      });
    }

    // Check for payment method via Stripe
    // First, check if we have stripe_customer_id in metadata
    let hasPaymentMethod = false;
    let stripeCustomerId = (metadata as any)?.stripe_customer_id;
    
    try {
      // Always try email lookup first to ensure we get the most up-to-date customer
      if (profile.email) {
        const customers = await stripe.customers.list({
          email: profile.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          stripeCustomerId = customer.id;
          
          // Update metadata if we found a customer ID that wasn't stored
          if (!(metadata as any)?.stripe_customer_id && stripeCustomerId) {
            try {
              await supabaseAdmin
                .from("profiles")
                .update({
                  metadata: {
                    ...metadata,
                    stripe_customer_id: stripeCustomerId,
                  },
                })
                .eq("id", agentId);
            } catch (updateError) {
              console.error("Error updating stripe_customer_id in metadata:", updateError);
              // Non-fatal, continue
            }
          }
          
          // Check if customer has payment methods
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            type: 'card',
            limit: 1,
          });

          hasPaymentMethod = paymentMethods.data.length > 0;
        }
      }
      
      // If email lookup didn't find anything, try using stored stripe_customer_id
      if (!hasPaymentMethod && stripeCustomerId) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card',
          limit: 1,
        });

        hasPaymentMethod = paymentMethods.data.length > 0;
      }
    } catch (stripeError: any) {
      console.error("Error checking Stripe payment methods:", stripeError);
      // If Stripe check fails, assume no payment method (safer default)
      hasPaymentMethod = false;
    }

    // CRITICAL FIX: If agent has both payment method AND availability, they are done with onboarding
    // Return needsOnboarding: false immediately - don't even check the flag
    // This ensures the modal NEVER shows once both requirements are met
    if (hasPaymentMethod && hasAvailability) {
      // Auto-mark as completed in the database for future reference
      const onboardingCompleted = (metadata as any)?.onboarding_completed === true;
      if (!onboardingCompleted) {
        try {
          await supabaseAdmin
            .from("profiles")
            .update({
              metadata: {
                ...metadata,
                onboarding_completed: true,
              },
            })
            .eq("id", agentId);
          console.log(`[ONBOARDING] Auto-marked onboarding as completed for agent ${agentId}`);
        } catch (updateError) {
          console.error("Error auto-marking onboarding as completed:", updateError);
          // Non-fatal - we still return needsOnboarding: false below
        }
      }
      
      // CRITICAL: Return needsOnboarding: false immediately when both are present
      console.log(`[ONBOARDING] Agent ${agentId} has both payment method and availability - returning needsOnboarding: false`);
      return NextResponse.json({
        needsOnboarding: false,
        hasPaymentMethod: true,
        hasAvailability: true,
        onboardingCompleted: true,
      });
    }

    // If either is missing, needs onboarding
    const needsOnboarding = !hasPaymentMethod || !hasAvailability;
    const onboardingCompleted = (metadata as any)?.onboarding_completed === true;

    return NextResponse.json({
      needsOnboarding: needsOnboarding && !onboardingCompleted,
      hasPaymentMethod,
      hasAvailability,
      onboardingCompleted,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/onboarding-status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

