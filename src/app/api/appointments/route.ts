// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createAppointmentSchema = z.object({
  specialistId: z.string().uuid(),
  familyId: z.string().uuid(),
  appointmentTypeId: z.string().uuid(),
  startsAt: z.string().datetime(), // ISO UTC timestamp
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { specialistId, familyId, appointmentTypeId, startsAt } =
      validation.data;

    // Load specialist, family, and appointment type
    const [specialistResult, familyResult, appointmentTypeResult] =
      await Promise.all([
        supabaseServer
          .from("specialists")
          .select("id, is_active")
          .eq("id", specialistId)
          .single(),
        supabaseServer
          .from("families")
          .select("id")
          .eq("id", familyId)
          .single(),
        supabaseServer
          .from("appointment_types")
          .select("id, duration_minutes, price_cents")
          .eq("id", appointmentTypeId)
          .single(),
      ]);

    if (specialistResult.error || !specialistResult.data) {
      return NextResponse.json(
        { error: "Specialist not found" },
        { status: 404 }
      );
    }

    if (!specialistResult.data.is_active) {
      return NextResponse.json(
        { error: "Specialist is not active" },
        { status: 400 }
      );
    }

    if (familyResult.error || !familyResult.data) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    if (appointmentTypeResult.error || !appointmentTypeResult.data) {
      return NextResponse.json(
        { error: "Appointment type not found" },
        { status: 404 }
      );
    }

    const { duration_minutes, price_cents } = appointmentTypeResult.data;
    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(
      startsAtDate.getTime() + duration_minutes * 60 * 1000
    );

    // Check for conflicts with existing appointments
    // Overlap condition: starts_at < new_ends_at AND ends_at > new_starts_at
    const { data: conflictingAppointments, error: appointmentsError } =
      await supabaseServer
        .from("appointments")
        .select("id")
        .eq("specialist_id", specialistId)
        .neq("status", "cancelled")
        .lt("starts_at", endsAtDate.toISOString())
        .gt("ends_at", startsAtDate.toISOString());

    if (appointmentsError) {
      console.error("Error checking appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to check for conflicts" },
        { status: 500 }
      );
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: "Time slot no longer available" },
        { status: 409 }
      );
    }

    // Check for conflicts with external events
    const { data: conflictingEvents, error: eventsError } =
      await supabaseServer
        .from("external_events")
        .select("id")
        .eq("specialist_id", specialistId)
        .neq("status", "cancelled")
        .lt("starts_at", endsAtDate.toISOString())
        .gt("ends_at", startsAtDate.toISOString());

    if (eventsError) {
      console.error("Error checking external events:", eventsError);
      return NextResponse.json(
        { error: "Failed to check for conflicts" },
        { status: 500 }
      );
    }

    if (conflictingEvents && conflictingEvents.length > 0) {
      return NextResponse.json(
        { error: "Time slot no longer available" },
        { status: 409 }
      );
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabaseServer
      .from("appointments")
      .insert({
        specialist_id: specialistId,
        family_id: familyId,
        appointment_type_id: appointmentTypeId,
        starts_at: startsAtDate.toISOString(),
        ends_at: endsAtDate.toISOString(),
        status: "confirmed",
      })
      .select()
      .single();

    if (appointmentError) {
      console.error("Error creating appointment:", appointmentError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    // Create payment if price > 0
    if (price_cents > 0 && appointment) {
      const { error: paymentError } = await supabaseServer
        .from("payments")
        .insert({
          appointment_id: appointment.id,
          amount_cents: price_cents,
          currency: "CAD",
          status: "requires_payment",
        });

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        // Don't fail the appointment creation, just log the error
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error("Error in /api/appointments:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

