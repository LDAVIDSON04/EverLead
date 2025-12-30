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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com";
    
    const html = approved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${siteUrl}/logo%20-%20white.png" alt="Soradin" style="height: 40px; width: auto; margin: 0 auto 10px; display: block;" />
            <div style="display: none;">
              <h1 style="color: #2a2a2a; font-size: 28px; margin: 0; font-weight: 300;">Soradin</h1>
              <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 5px 0 0 0;">Pre-Planning</p>
            </div>
          </div>
          <h2 style="color: #2a2a2a; margin-bottom: 20px;">Account Approved</h2>
          <p>Hi ${fullName || "there"},</p>
          <p>Great news! Your Soradin agent account has been approved. You can now log in and start purchasing leads.</p>
          <p style="margin-top: 30px;">
            <a href="${siteUrl}/agent" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
              Log In to Agent Portal
            </a>
          </p>
          <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Soradin. All rights reserved.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${siteUrl}/logo%20-%20white.png" alt="Soradin" style="height: 40px; width: auto; margin: 0 auto 10px; display: block;" />
            <div style="display: none;">
              <h1 style="color: #2a2a2a; font-size: 28px; margin: 0; font-weight: 300;">Soradin</h1>
              <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 5px 0 0 0;">Pre-Planning</p>
            </div>
          </div>
          <h2 style="color: #2a2a2a; margin-bottom: 20px;">Application Update</h2>
          <p>Hi ${fullName || "there"},</p>
          <p>Thank you for your interest in Soradin. Unfortunately, we are unable to approve your agent account at this time.</p>
          ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
          <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
            If you have any questions or would like to discuss this decision, please contact our support team.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Soradin. All rights reserved.
          </p>
        </div>
      `;

    // Ensure email is branded as Soradin
    let fromEmail = process.env.RESEND_FROM_EMAIL || "Soradin <notifications@soradin.com>";
    
    // If RESEND_FROM_EMAIL doesn't have the Soradin name, wrap it
    if (fromEmail && !fromEmail.includes('<')) {
      // Extract domain if it's just an email address
      const emailMatch = fromEmail.match(/^(.+@(.+))$/);
      if (emailMatch) {
        fromEmail = `Soradin <${fromEmail}>`;
      } else {
        fromEmail = "Soradin <notifications@soradin.com>";
      }
    } else if (fromEmail && fromEmail.includes('<')) {
      // If it already has a name, replace it with Soradin
      const emailMatch = fromEmail.match(/<(.+@.+?)>/);
      if (emailMatch) {
        fromEmail = `Soradin <${emailMatch[1]}>`;
      }
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
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

    if (!agentId || !action || !["approve", "decline", "request-info"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. agentId and action (approve/decline/request-info) are required." },
        { status: 400 }
      );
    }

    // Get agent profile (email is in auth.users, not profiles)
    // Include bio information for unified approval
    const { data: agentProfile, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, approval_status, ai_generated_bio, bio_approval_status, bio_audit_log")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError || !agentProfile) {
      console.error("Error fetching agent profile:", agentError);
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get email from auth.users
    let agentEmail: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
      agentEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.error("Error fetching agent email from auth.users:", authError);
      // Continue without email - we'll skip the email notification
    }

    if (!agentEmail) {
      console.warn(`No email found for agent ${agentId} - approval will proceed but no email will be sent`);
    }

    // Single unified approval - approve/decline the entire submission (profile + bio)
    const updateData: any = {};
    
    if (action === "approve") {
      // Approve everything at once
      updateData.approval_status = "approved";
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = adminUserId || null;
      
      // Also approve bio if it exists
      if (agentProfile.ai_generated_bio) {
        updateData.bio_approval_status = "approved";
        updateData.bio_last_updated = new Date().toISOString();
      }
    } else if (action === "decline") {
      // Decline everything at once
      updateData.approval_status = "declined";
      updateData.approved_at = null;
      updateData.approved_by = null;
      
      // Also decline bio if it exists
      if (agentProfile.ai_generated_bio) {
        updateData.bio_approval_status = "rejected";
        updateData.bio_last_updated = new Date().toISOString();
      }
      
      if (notes) {
        updateData.approval_notes = notes;
      }
    } else if (action === "request-info") {
      // Request more information - set status to needs-info
      updateData.approval_status = "needs-info";
      
      if (notes) {
        updateData.approval_notes = notes;
      }
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

    // Send email notification (if email is available)
    // Only send for approve/decline, not for request-info (that will be handled separately if needed)
    if (agentEmail && (action === "approve" || action === "decline")) {
      await sendApprovalEmail(
        agentEmail,
        agentProfile.full_name,
        action === "approve",
        notes
      );
    } else if (agentEmail && action === "request-info") {
      // TODO: Send "request more info" email notification
      console.log(`Request more info email should be sent to ${agentEmail} with notes: ${notes}`);
    } else {
      console.warn(`Skipping email notification for agent ${agentId} - no email found`);
    }

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

