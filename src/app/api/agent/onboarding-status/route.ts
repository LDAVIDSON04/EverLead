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
    const agentEmail = user.email; // Get email from auth user, not profile (profile.email can be null)

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
    
    // Also get office locations to merge with availability
    const { data: officeLocations } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", agentId);
    
    const officeLocationCities: string[] = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );
    
    // Check that availability has locations AND at least one location has time slots enabled
    const locations = availabilityData.locations || [];
    const availabilityByLocation = availabilityData.availabilityByLocation || {};
    
    // Merge office locations with availability locations
    const allLocationCities = Array.from(new Set([...locations, ...officeLocationCities]));
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Checking availability. Locations from metadata: ${locations.length}, Office locations: ${officeLocationCities.length}, AvailabilityByLocation keys: ${Object.keys(availabilityByLocation).length}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Locations from metadata: ${JSON.stringify(locations)}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Office location cities: ${JSON.stringify(officeLocationCities)}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: AvailabilityByLocation keys: ${JSON.stringify(Object.keys(availabilityByLocation))}`);
    
    let hasAvailability = false;
    if (allLocationCities.length > 0 && Object.keys(availabilityByLocation).length > 0) {
      // Check if at least one location has at least one day enabled
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      hasAvailability = Object.keys(availabilityByLocation).some((locationKey) => {
        const locationSchedule = availabilityByLocation[locationKey];
        if (!locationSchedule || typeof locationSchedule !== 'object') return false;
        return days.some((day: string) => {
          const dayData = locationSchedule[day];
          return dayData && typeof dayData === 'object' && dayData.enabled === true;
        });
      });
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Has availability with enabled days: ${hasAvailability}`);
    } else {
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: No availability data found (all locations: ${allLocationCities.length}, availabilityByLocation: ${Object.keys(availabilityByLocation).length})`);
    }
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Final hasAvailability: ${hasAvailability}`);

    // Check for payment method via Stripe
    // First, check if we have stripe_customer_id in metadata
    let hasPaymentMethod = false;
    let stripeCustomerId = (metadata as any)?.stripe_customer_id;
    
    // Use auth user email (which is always set) instead of profile.email (which can be null)
    const emailToUse = agentEmail || profile.email;
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Checking payment method. Auth user email: ${agentEmail}, Profile email: ${profile.email}, Email to use: ${emailToUse}, Stripe Customer ID in metadata: ${stripeCustomerId || 'NOT FOUND'}`);
    
    try {
      // Always try email lookup first to ensure we get the most up-to-date customer
      if (emailToUse) {
        const customers = await stripe.customers.list({
          email: emailToUse,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          stripeCustomerId = customer.id;
          
          console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Found Stripe customer by email: ${stripeCustomerId}`);
          
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
              console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Saved Stripe customer ID to metadata`);
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
          console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Payment methods found by email lookup: ${paymentMethods.data.length}, hasPaymentMethod: ${hasPaymentMethod}`);
        } else {
          console.log(`[ONBOARDING-STATUS] Agent ${agentId}: No Stripe customer found by email: ${emailToUse}`);
        }
      }
      
      // If email lookup didn't find anything, try using stored stripe_customer_id
      if (!hasPaymentMethod && stripeCustomerId) {
        console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Trying stored Stripe customer ID: ${stripeCustomerId}`);
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card',
          limit: 1,
        });

        hasPaymentMethod = paymentMethods.data.length > 0;
        console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Payment methods found by stored ID: ${paymentMethods.data.length}, hasPaymentMethod: ${hasPaymentMethod}`);
      }
    } catch (stripeError: any) {
      console.error(`[ONBOARDING-STATUS] Agent ${agentId}: Error checking Stripe payment methods:`, stripeError);
      // If Stripe check fails, assume no payment method (safer default)
      hasPaymentMethod = false;
    }
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Final hasPaymentMethod: ${hasPaymentMethod}`);

    // CRITICAL FIX: If agent has both payment method AND availability, they are done with onboarding
    // Return needsOnboarding: false immediately - don't even check the flag
    // This ensures the modal NEVER shows once both requirements are met
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Evaluating onboarding status. hasPaymentMethod: ${hasPaymentMethod}, hasAvailability: ${hasAvailability}`);
    
    if (hasPaymentMethod && hasAvailability) {
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: BOTH CONDITIONS MET - marking as completed`);
      
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
          console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Auto-marked onboarding as completed in database`);
        } catch (updateError) {
          console.error(`[ONBOARDING-STATUS] Agent ${agentId}: Error auto-marking onboarding as completed:`, updateError);
          // Non-fatal - we still return needsOnboarding: false below
        }
      }
      
      // CRITICAL: Return needsOnboarding: false immediately when both are present
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: RETURNING needsOnboarding: false (has both payment and availability)`);
      return NextResponse.json({
        needsOnboarding: false,
        hasPaymentMethod: true,
        hasAvailability: true,
        onboardingCompleted: true,
      });
    }
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Conditions NOT met. hasPaymentMethod: ${hasPaymentMethod}, hasAvailability: ${hasAvailability}`);

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

