import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function sendResetEmail(email: string, resetUrl: string, siteUrl: string, fromEmail: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY not set - cannot send password reset email");
    throw new Error("Email service not configured");
  }

  console.log("Sending password reset email:", {
    to: email,
    from: fromEmail,
    resetUrl: resetUrl.substring(0, 50) + "...", // Log partial URL for security
    hasResendKey: !!resendApiKey,
  });

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
              <a href="${resetUrl}" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                Reset Password
              </a>
            </p>
            <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="margin-top: 15px; color: #6b6b6b; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetUrl}" style="color: #2a2a2a; word-break: break-all;">${resetUrl}</a>
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error("Resend API error:", {
        status: resendResponse.status,
        error: errorData,
        fullResponse: errorText,
      });
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorData.message || errorText}`);
    }

    const responseData = await resendResponse.json().catch(() => ({}));
    console.log("Password reset email sent successfully:", {
      emailId: responseData?.id,
      to: email,
    });
  } catch (emailError: any) {
    console.error("Error sending password reset email:", {
      error: emailError.message,
      stack: emailError.stack,
      to: email,
    });
    throw emailError;
  }
}

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com";
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${siteUrl}/agent/reset-password`,
      },
    });

    if (resetError || !resetData) {
      console.error("Error generating reset link:", resetError);
      return NextResponse.json(
        { error: "Error generating reset link" },
        { status: 500 }
      );
    }

    console.log("Reset link generated:", {
      hasActionLink: !!resetData.action_link,
      hasProperties: !!resetData.properties,
      properties: resetData.properties,
    });

    // Supabase generateLink returns an action_link with the full URL
    // Extract the token from the action_link or use the properties
    let resetUrl: string;
    
    if (resetData.action_link) {
      // Extract token from action_link
      const actionUrl = new URL(resetData.action_link);
      const token = actionUrl.searchParams.get('token') || actionUrl.hash.split('token=')[1]?.split('&')[0];
      
      if (token) {
        resetUrl = `${siteUrl}/agent/reset-password?token=${token}`;
      } else {
        // If no token in URL, try to use the action_link directly but replace domain
        resetUrl = resetData.action_link.replace(/https?:\/\/[^\/]+/, siteUrl);
      }
    } else {
      // Fallback: try to get token from properties
      const props = resetData.properties as any;
      const resetToken = props?.hashed_token || props?.token_hash || props?.token;
      
      if (!resetToken) {
        console.error("No reset token found in resetData:", JSON.stringify(resetData, null, 2));
        return NextResponse.json(
          { error: "Error generating reset token" },
          { status: 500 }
        );
      }
      
      resetUrl = `${siteUrl}/agent/reset-password?token=${resetToken}`;
    }

    console.log("Reset URL:", resetUrl);

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

    // Send email using Resend
    try {
      await sendResetEmail(email, resetUrl, siteUrl, fromEmail);
      console.log("Password reset email sent successfully to:", email);
    } catch (emailError: any) {
      console.error("Failed to send password reset email:", emailError);
      // Don't fail the request - still return success for security
      // But log the error for debugging
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

