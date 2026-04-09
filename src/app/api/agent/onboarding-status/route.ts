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

    // Get profile with approval status and profile picture
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, approval_status, metadata, email, profile_picture_url")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if onboarding is already completed (one-time flag)
    const metadata = profile.metadata || {};
    const onboardingCompleted = (metadata as any)?.onboarding_completed === true;
    
    // If onboarding is completed, never show modal again
    if (onboardingCompleted) {
      return NextResponse.json({
        needsOnboarding: false,
        hasProfilePicture: !!profile.profile_picture_url,
        hasAvailability: false,
        onboardingCompleted: true,
      });
    }

    // Only check onboarding if agent is approved
    if (profile.approval_status !== "approved") {
      return NextResponse.json({
        needsOnboarding: false,
        hasProfilePicture: false,
        hasAvailability: false,
        onboardingCompleted: false,
      });
    }

    // Check for profile picture
    const hasProfilePicture = !!profile.profile_picture_url;
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: hasProfilePicture: ${hasProfilePicture}`);

    // Check for availability in metadata
    const availabilityData = metadata.availability || {};
    
    // Also get office locations to merge with availability
    const { data: officeLocations } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", agentId);
    
    const officeLocationCities: string[] = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );
    
    // Check that availability has in-person locations with time slots OR video schedule with at least one day enabled
    const locations = availabilityData.locations || [];
    const availabilityByLocation = availabilityData.availabilityByLocation || {};
    const videoSchedule = availabilityData.videoSchedule || {};
    
    // Merge office locations with availability locations
    const allLocationCities = Array.from(new Set([...locations, ...officeLocationCities]));
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Checking availability. Locations from metadata: ${locations.length}, Office locations: ${officeLocationCities.length}, AvailabilityByLocation keys: ${Object.keys(availabilityByLocation).length}, videoSchedule: ${Object.keys(videoSchedule).length}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Locations from metadata: ${JSON.stringify(locations)}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Office location cities: ${JSON.stringify(officeLocationCities)}`);
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: AvailabilityByLocation keys: ${JSON.stringify(Object.keys(availabilityByLocation))}`);
    
    let hasAvailability = false;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // In-person: at least one location with at least one day enabled
    if (allLocationCities.length > 0 && Object.keys(availabilityByLocation).length > 0) {
      hasAvailability = Object.keys(availabilityByLocation).some((locationKey) => {
        const locationSchedule = availabilityByLocation[locationKey];
        if (!locationSchedule || typeof locationSchedule !== 'object') return false;
        return days.some((day: string) => {
          const dayData = locationSchedule[day];
          return dayData && typeof dayData === 'object' && dayData.enabled === true;
        });
      });
    }
    
    // Video-only: if no in-person availability, count video schedule (so saving video availability is recognized)
    if (!hasAvailability && videoSchedule && typeof videoSchedule === 'object') {
      hasAvailability = days.some((day: string) => {
        const dayData = (videoSchedule as any)[day];
        return dayData && typeof dayData === 'object' && dayData.enabled === true;
      });
      if (hasAvailability) console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Has video availability (counts as step complete)`);
    }
    
    if (!hasAvailability) {
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: No availability data found (all locations: ${allLocationCities.length}, availabilityByLocation: ${Object.keys(availabilityByLocation).length})`);
    }
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Final hasAvailability: ${hasAvailability}`);

    // Onboarding is profile picture + availability only (payment is optional / Billing).
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Evaluating onboarding status. hasProfilePicture: ${hasProfilePicture}, hasAvailability: ${hasAvailability}`);
    
    if (hasProfilePicture && hasAvailability) {
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Profile + availability complete - marking onboarding completed`);
      
      // Auto-mark as completed in the database for future reference
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
      
      console.log(`[ONBOARDING-STATUS] Agent ${agentId}: RETURNING needsOnboarding: false (profile + availability)`);
      return NextResponse.json({
        needsOnboarding: false,
        hasProfilePicture: true,
        hasAvailability: true,
        onboardingCompleted: true,
      });
    }
    
    console.log(`[ONBOARDING-STATUS] Agent ${agentId}: Conditions NOT met. hasProfilePicture: ${hasProfilePicture}, hasAvailability: ${hasAvailability}`);

    const needsOnboarding = !hasProfilePicture || !hasAvailability;

    return NextResponse.json({
      needsOnboarding: needsOnboarding && !onboardingCompleted,
      hasProfilePicture,
      hasAvailability,
      onboardingCompleted: false,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/onboarding-status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

