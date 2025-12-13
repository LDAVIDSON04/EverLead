// src/app/api/appointments/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";
import { deleteExternalEventsForAppointment } from "@/lib/calendarSync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  cancelledBy: z.enum(["family", "specialist"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = cancelAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { appointmentId, cancelledBy } = validation.data;

    // Check if appointment exists
    const { data: appointment, error: fetchError } = await supabaseServer
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
        { status: 400 }
      );
    }

    // Update appointment status
    const { data: updatedAppointment, error: updateError } =
      await supabaseServer
        .from("appointments")
        .update({
          status: "cancelled",
          notes: `Cancelled by ${cancelledBy} on ${new Date().toISOString()}. ${appointment.notes || ""}`.trim(),
        })
        .eq("id", appointmentId)
        .select()
        .single();

    if (updateError) {
      console.error("Error cancelling appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    // Delete from external calendars (non-blocking)
    try {
      await deleteExternalEventsForAppointment(appointmentId);
    } catch (syncError) {
      console.error("Error deleting appointment from calendars:", syncError);
      // Don't fail the cancellation if sync deletion fails
    }

    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    console.error("Error in /api/appointments/cancel:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

