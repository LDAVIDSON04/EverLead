// src/app/api/admin/approve-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

async function sendApprovalEmail(email: string, fullName: string | null, approved: boolean, notes?: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("📧 Email notification (not sent - no RESEND_API_KEY):", {
      to: email,
      approved,
      notes,
    });
    return;
  }

  try {
    const subject = approved
      ? "Your Soradin Agent Account Has Been Approved"
      : "Your Soradin Agent Account Application";

    const html = approved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a2a2a;">Account Approved</h2>
          <p>Hi ${fullName || "there"},</p>
          <p>Great news! Your Soradin agent account has been approved. You can now log in and start purchasing leads.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com"}/agent" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Log In to Agent Portal
            </a>
          </p>
          <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a2a2a;">Application Update</h2>
          <p>Hi ${fullName || "there"},</p>
          <p>Thank you for your interest in Soradin. Unfortunately, we are unable to approve your agent account at this time.</p>
          ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
          <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
            If you have any questions or would like to discuss this decision, please contact our support team.
          </p>
        </div>
      `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Soradin <notifications@soradin.com>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error sending approval email:", error);
    // Don't throw - email failure shouldn't block approval
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get admin user ID from request body (sent by frontend)
    const body = await req.json();
    const { agentId, action, notes, adminUserId } = body;

    // Verify admin (using adminUserId from frontend)
    if (adminUserId) {
      const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .maybeSingle();

      if (!adminProfile || adminProfile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
      }
    }

    if (!agentId || !action || !["approve", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. agentId and action (approve/decline) are required." },
        { status: 400 }
      );
    }

    // Get agent profile
    const { data: agentProfile, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, approval_status")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError || !agentProfile) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Update approval status
    const updateData: any = {
      approval_status: action === "approve" ? "approved" : "declined",
      approved_at: action === "approve" ? new Date().toISOString() : null,
      approved_by: action === "approve" && adminUserId ? adminUserId : null,
    };

    if (notes) {
      updateData.approval_notes = notes;
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", agentId);

    if (updateError) {
      console.error("Error updating agent approval:", updateError);
      return NextResponse.json(
        { error: "Failed to update agent approval status" },
        { status: 500 }
      );
    }

    // Send email notification
    await sendApprovalEmail(
      agentProfile.email!,
      agentProfile.full_name,
      action === "approve",
      notes
    );

    return NextResponse.json(
      { success: true, message: `Agent ${action === "approve" ? "approved" : "declined"} successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in approve-agent route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

