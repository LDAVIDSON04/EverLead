import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return NextResponse.json(
        { error: "Error checking user" },
        { status: 500 }
      );
    }

    const user = users?.users.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json(
        { success: true, message: "If an account exists with that email, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate a password reset token
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (resetError || !resetData) {
      console.error("Error generating reset link:", resetError);
      return NextResponse.json(
        { error: "Error generating reset link" },
        { status: 500 }
      );
    }

    // Get the reset token from the properties
    // Supabase generateLink returns the properties with the token
    const resetToken = (resetData.properties as any)?.hashed_token || (resetData.properties as any)?.token_hash || (resetData.properties as any)?.token;
    
    if (!resetToken) {
      console.error("No reset token found in resetData:", resetData);
      return NextResponse.json(
        { error: "Error generating reset token" },
        { status: 500 }
      );
    }

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com";
    
    // Ensure email is branded as Soradin
    let fromEmail = process.env.RESEND_FROM_EMAIL || "Soradin <notifications@soradin.com>";
    
    if (fromEmail && !fromEmail.includes('<')) {
      fromEmail = `Soradin <${fromEmail}>`;
    } else if (fromEmail && fromEmail.includes('<')) {
      const emailMatch = fromEmail.match(/<(.+@.+?)>/);
      if (emailMatch) {
        fromEmail = `Soradin <${emailMatch[1]}>`;
      }
    }

    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: "Reset your Soradin password",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${siteUrl}/logo.png" alt="Soradin" style="height: 40px; width: auto; margin: 0 auto 10px; display: block;" />
                  <div style="display: none;">
                    <h1 style="color: #2a2a2a; font-size: 28px; margin: 0; font-weight: 300;">Soradin</h1>
                    <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 5px 0 0 0;">Pre-Planning</p>
                  </div>
                </div>
                <h2 style="color: #2a2a2a; margin-bottom: 20px;">Reset your password</h2>
                <p>Hi there,</p>
                <p>We received a request to reset your password for your Soradin agent account.</p>
                <p style="margin-top: 30px;">
                  <a href="${siteUrl}/agent/reset-password?token=${resetToken}" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                    Reset Password
                  </a>
                </p>
                <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
                  This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
                <p style="margin-top: 15px; color: #6b6b6b; font-size: 12px;">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${siteUrl}/agent/reset-password?token=${resetToken}" style="color: #2a2a2a; word-break: break-all;">${siteUrl}/agent/reset-password?token=${resetToken}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
                <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Soradin. All rights reserved.
                </p>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error("Resend API error:", errorText);
          // Fall through to return success anyway (don't reveal if email was sent)
        }
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Fall through to return success anyway
      }
    }

    // Always return success (don't reveal if user exists)
    return NextResponse.json(
      { success: true, message: "If an account exists with that email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

