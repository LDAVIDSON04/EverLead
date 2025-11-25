import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f7f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f7f4ef; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                    <!-- Header with Logo -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(to bottom, #faf8f5, #ffffff);">
                        <img src="${siteUrl}/logo.png" alt="Soradin" style="height: 48px; width: auto; margin: 0 auto 12px; display: block; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div style="display: none;">
                          <h1 style="color: #2a2a2a; font-size: 32px; margin: 0; font-weight: 300; letter-spacing: -0.5px;">Soradin</h1>
                          <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 8px 0 0 0;">Pre-Planning</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #2a2a2a; font-size: 24px; font-weight: 400; margin: 0 0 20px; letter-spacing: -0.3px;">Reset your password</h2>
                        
                        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hello,</p>
                        
                        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                          We received a request to reset your password for your Soradin agent account. Click the button below to create a new password.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                          <tr>
                            <td align="center" style="padding: 0;">
                              <a href="${resetUrl}" style="display: inline-block; background-color: #2a2a2a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500; letter-spacing: 0.3px;">Reset Password</a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Info Box -->
                        <div style="background-color: #f7f4ef; border-left: 3px solid #2a2a2a; padding: 16px 20px; margin: 32px 0; border-radius: 4px;">
                          <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 0;">
                            <strong style="color: #2a2a2a;">Important:</strong> This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.
                          </p>
                        </div>
                        
                        <!-- Alternative Link -->
                        <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="color: #2a2a2a; font-size: 13px; line-height: 1.6; margin: 8px 0 0; word-break: break-all; font-family: 'Courier New', monospace; background-color: #f7f4ef; padding: 12px; border-radius: 4px;">
                          <a href="${resetUrl}" style="color: #2a2a2a; text-decoration: underline;">${resetUrl}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #faf8f5; border-top: 1px solid #e5e5e5;">
                        <p style="color: #6b6b6b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                          © ${new Date().getFullYear()} Soradin. All rights reserved.<br/>
                          <span style="color: #9b9b9b;">This is an automated message. Please do not reply to this email.</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
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
  console.log("🔐 [FORGOT-PASSWORD] Request received");
  
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      console.error("🔐 [FORGOT-PASSWORD] Supabase admin client not initialized");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { email } = body;
    
    console.log("🔐 [FORGOT-PASSWORD] Email received:", email ? "yes" : "no", email ? email.substring(0, 3) + "***" : "none");

    if (!email) {
      console.error("🔐 [FORGOT-PASSWORD] No email provided");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    console.log("🔐 [FORGOT-PASSWORD] Processing request for:", email);

    // Check if user exists
    console.log("🔐 [FORGOT-PASSWORD] Checking if user exists...");
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("🔐 [FORGOT-PASSWORD] Error listing users:", userError);
      return NextResponse.json(
        { error: "Error checking user" },
        { status: 500 }
      );
    }

    console.log("🔐 [FORGOT-PASSWORD] Found", users?.users?.length || 0, "total users");
    
    // Check user emails (case-insensitive comparison)
    const emailLower = email.toLowerCase().trim();
    const user = users?.users.find((u: any) => {
      const userEmail = (u.email || "").toLowerCase().trim();
      return userEmail === emailLower;
    });

    if (!user) {
      console.log("🔐 [FORGOT-PASSWORD] User not found for email:", email);
      console.log("🔐 [FORGOT-PASSWORD] Available emails:", users?.users?.map((u: any) => u.email).filter(Boolean));
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json(
        { success: true, message: "If an account exists with that email, a password reset link has been sent." },
        { status: 200 }
      );
    }
    
    console.log("🔐 [FORGOT-PASSWORD] User found:", user.id, "email:", user.email);

    // Generate a password reset token
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com";
    
    // Clean siteUrl for redirectTo
    let cleanRedirectUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanRedirectUrl.startsWith('http')) {
      cleanRedirectUrl = `https://${cleanRedirectUrl}`;
    }
    const redirectTo = `${cleanRedirectUrl}/agent/reset-password`;
    
    console.log("🔐 [FORGOT-PASSWORD] Generating reset link with:", {
      email: email.substring(0, 3) + "***",
      redirectTo,
      hasSupabaseAdmin: !!supabaseAdmin,
    });
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (resetError || !resetData) {
      console.error("🔐 [FORGOT-PASSWORD] Error generating reset link:", {
        error: resetError,
        errorMessage: resetError?.message,
        errorCode: resetError?.code,
        errorStatus: resetError?.status,
        hasResetData: !!resetData,
        resetData: resetData,
        email: email,
        siteUrl: siteUrl,
      });
      return NextResponse.json(
        { 
          error: "Error generating reset link",
          details: process.env.NODE_ENV === "development" ? resetError?.message : undefined
        },
        { status: 500 }
      );
    }

    console.log("🔐 [FORGOT-PASSWORD] Reset link generated:", {
      hasActionLink: !!resetData.action_link,
      actionLink: resetData.action_link?.substring(0, 100) + '...',
      hasProperties: !!resetData.properties,
      properties: resetData.properties,
    });

    // Use Supabase's action_link directly - it already has the correct URL and token
    // Replace the domain with our site URL to ensure it points to our app
    let resetUrl = resetData.action_link;
    
    if (resetUrl && siteUrl) {
      // Extract our domain from siteUrl
      let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
      if (!cleanBaseUrl.startsWith('http')) {
        cleanBaseUrl = `https://${cleanBaseUrl}`;
      }
      
      // Replace the domain in action_link with our domain
      try {
        const actionUrl = new URL(resetUrl);
        const ourUrl = new URL(cleanBaseUrl);
        // Replace the hostname and protocol, keep the path and query
        resetUrl = `${ourUrl.protocol}//${ourUrl.host}${actionUrl.pathname}${actionUrl.search}${actionUrl.hash}`;
      } catch (e) {
        console.error("🔐 [FORGOT-PASSWORD] Error parsing action_link, using as-is:", e);
        // If parsing fails, use action_link as-is
      }
    }
    
    if (!resetUrl) {
      console.error("🔐 [FORGOT-PASSWORD] No reset URL available:", JSON.stringify(resetData, null, 2));
      return NextResponse.json(
        { error: "Error generating reset link" },
        { status: 500 }
      );
    }
    
    // Clean base URL for logo
    let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanBaseUrl.startsWith('http')) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    
    console.log("🔐 [FORGOT-PASSWORD] Final reset URL:", resetUrl.substring(0, 100) + '...');
    console.log("🔐 [FORGOT-PASSWORD] Clean base URL for logo:", cleanBaseUrl);

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
      await sendResetEmail(email, resetUrl, cleanBaseUrl, fromEmail);
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
    console.error("🔐 [FORGOT-PASSWORD] Error in route:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

