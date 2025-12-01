// src/app/api/appointments/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointmentId = body.appointmentId as string | undefined;
    const status = body.status as "completed" | "no_show" | undefined;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: "Missing appointmentId or status" },
        { status: 400 }
      );
    }

    if (status !== "completed" && status !== "no_show") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'completed' or 'no_show'" },
        { status: 400 }
      );
    }

    // Note: The database schema must allow 'no_show' status
    // If you get a constraint violation, run the migration: add_no_show_status_to_appointments.sql

    // Get agentId from request body (client sends it)
    const agentId = body.agentId as string | undefined;

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // Verify agent is approved
    const { data: agentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, approval_status")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !agentProfile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    if (agentProfile.role !== "agent" || agentProfile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent account not approved" },
        { status: 403 }
      );
    }

    // Only allow agent to update their own appointment
    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, status")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appt.agent_id !== agentId) {
      return NextResponse.json(
        { error: "You do not own this appointment" },
        { status: 403 }
      );
    }

    // Update status and set appropriate timestamp
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      // Only add completed_at if the column exists (check via safe update)
      // If column doesn't exist, we'll catch the error and retry without it
      updateData.completed_at = new Date().toISOString();
    } else if (status === "no_show") {
      // For no_show, we can also set cancelled_at or leave it
      // The schema has cancelled_at, but we'll use status='no_show' instead
    }

    console.log("Attempting to update appointment:", {
      appointmentId,
      status,
      agentId,
      updateData,
    });

    let { error: updateError, data: updateDataResult } = await supabaseAdmin
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select();

    // If error is due to missing column (PGRST204), retry without that column
    if (updateError && updateError.code === 'PGRST204') {
      console.warn("⚠️ Column missing error detected, retrying without optional timestamp column:", {
        errorMessage: updateError.message,
        updateData,
      });
      
      // Remove completed_at if it was included and caused the error
      const retryData: any = {
        status: updateData.status,
        updated_at: updateData.updated_at,
      };
      
      // Only retry with status and updated_at
      const retryResult = await supabaseAdmin
        .from("appointments")
        .update(retryData)
        .eq("id", appointmentId)
        .select();
      
      updateError = retryResult.error;
      updateDataResult = retryResult.data;
      
      if (!updateError) {
        console.log("✅ Successfully updated appointment (without optional timestamp column)");
      }
    }

    if (updateError) {
      console.error("❌ Error updating appointment:", {
        error: updateError,
        updateData,
        appointmentId,
        agentId,
        status,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        errorHint: updateError.hint,
        fullError: JSON.stringify(updateError, null, 2),
      });
      
      // Return more detailed error for debugging
      return NextResponse.json(
        { 
          error: "Error updating appointment",
          details: updateError.message || "Unknown database error",
          code: updateError.code,
          hint: updateError.hint || "Please run migration: add_completed_at_to_appointments.sql",
        },
        { status: 500 }
      );
    }

    console.log("✅ Successfully updated appointment:", {
      appointmentId,
      status,
      updateDataResult,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Appointment update error:", {
      error: err,
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: err?.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

