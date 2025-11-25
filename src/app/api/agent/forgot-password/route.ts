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
    // IMPORTANT: Make sure NEXT_PUBLIC_SITE_URL is set correctly in Vercel (not localhost!)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://soradin.com";
    
    if (siteUrl.includes('localhost')) {
      console.warn("🔐 [FORGOT-PASSWORD] WARNING: NEXT_PUBLIC_SITE_URL contains localhost! This will cause issues. Current value:", siteUrl);
    }
    
    // Clean siteUrl for redirectTo - Supabase requires exact match in allowed URLs
    let cleanRedirectUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanRedirectUrl.startsWith('http')) {
      cleanRedirectUrl = `https://${cleanRedirectUrl}`;
    }
    const redirectTo = `${cleanRedirectUrl}/agent/reset-password`;
    
    console.log("🔐 [FORGOT-PASSWORD] Generating reset link with:", {
      email: email.substring(0, 3) + "***",
      redirectTo,
      hasSupabaseAdmin: !!supabaseAdmin,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    
    let resetData, resetError;
    try {
      const result = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: redirectTo,
        },
      });
      resetData = result.data;
      resetError = result.error;
    } catch (generateError: any) {
      console.error("🔐 [FORGOT-PASSWORD] Exception during generateLink:", {
        error: generateError,
        message: generateError?.message,
        stack: generateError?.stack,
        name: generateError?.name,
      });
      resetError = generateError;
      resetData = null;
    }

    if (resetError || !resetData) {
      console.error("🔐 [FORGOT-PASSWORD] Error generating reset link:", {
        error: resetError,
        errorMessage: resetError?.message,
        errorCode: resetError?.code,
        errorStatus: resetError?.status,
        errorName: resetError?.name,
        hasResetData: !!resetData,
        resetData: resetData ? {
          hasActionLink: !!resetData.action_link,
          hasProperties: !!resetData.properties,
        } : null,
        email: email.substring(0, 3) + "***",
        redirectTo,
        siteUrl,
      });
      
      // Provide more helpful error message
      let errorMessage = "Error generating reset link";
      if (resetError?.message?.includes("redirect")) {
        errorMessage = "The reset URL is not configured. Please contact support.";
      } else if (resetError?.message) {
        errorMessage = `Error: ${resetError.message}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? {
            message: resetError?.message,
            code: resetError?.code,
            redirectTo,
          } : undefined
        },
        { status: 500 }
      );
    }

    console.log("🔐 [FORGOT-PASSWORD] Reset link generated:", {
      hasActionLink: !!resetData.action_link,
      hasProperties: !!resetData.properties,
      hasPropertiesActionLink: !!resetData.properties?.action_link,
      actionLink: resetData.action_link?.substring(0, 100) + '...',
      propertiesActionLink: resetData.properties?.action_link?.substring(0, 100) + '...',
    });

    // Supabase returns action_link in properties, not directly on resetData
    const actionLink = resetData.action_link || resetData.properties?.action_link;
    const hashedToken = resetData.properties?.hashed_token;
    
    if (!actionLink && !hashedToken) {
      console.error("🔐 [FORGOT-PASSWORD] No action_link or hashed_token found:", JSON.stringify(resetData, null, 2));
      return NextResponse.json(
        { error: "Error generating reset link - missing token" },
        { status: 500 }
      );
    }
    
    // Build reset URL - use action_link if available, otherwise construct from token
    let resetUrl: string;
    
    if (actionLink) {
      // Use Supabase's action_link but replace the redirect_to with our URL
      try {
        const actionUrl = new URL(actionLink);
        // Extract our domain from siteUrl
        let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
        if (!cleanBaseUrl.startsWith('http')) {
          cleanBaseUrl = `https://${cleanBaseUrl}`;
        }
        const ourUrl = new URL(cleanBaseUrl);
        
        // Build our reset URL with the token from action_link
        const token = actionUrl.searchParams.get('token');
        const type = actionUrl.searchParams.get('type') || 'recovery';
        
        if (token) {
          resetUrl = `${ourUrl.origin}/agent/reset-password?token=${encodeURIComponent(token)}`;
        } else {
          // Fallback: use action_link as-is but replace redirect_to
          resetUrl = actionLink.replace(/redirect_to=[^&]*/, `redirect_to=${encodeURIComponent(`${ourUrl.origin}/agent/reset-password`)}`);
        }
      } catch (e) {
        console.error("🔐 [FORGOT-PASSWORD] Error parsing action_link:", e);
        // Fallback: construct URL from hashed_token
        if (hashedToken) {
          let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
          if (!cleanBaseUrl.startsWith('http')) {
            cleanBaseUrl = `https://${cleanBaseUrl}`;
          }
          resetUrl = `${cleanBaseUrl}/agent/reset-password?token=${encodeURIComponent(hashedToken)}`;
        } else {
          resetUrl = actionLink; // Use as-is if we can't parse it
        }
      }
    } else if (hashedToken) {
      // Construct URL from hashed_token
      let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
      if (!cleanBaseUrl.startsWith('http')) {
        cleanBaseUrl = `https://${cleanBaseUrl}`;
      }
      resetUrl = `${cleanBaseUrl}/agent/reset-password?token=${encodeURIComponent(hashedToken)}`;
    } else {
      console.error("🔐 [FORGOT-PASSWORD] No reset URL can be constructed:", JSON.stringify(resetData, null, 2));
      return NextResponse.json(
        { error: "Error generating reset link" },
        { status: 500 }
      );
    }
    
    console.log("🔐 [FORGOT-PASSWORD] Constructed reset URL:", resetUrl.substring(0, 100) + '...');
    
    // Clean base URL for logo
    let cleanBaseUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanBaseUrl.startsWith('http')) {
      cleanBaseUrl = `https://${cleanBaseUrl}`;
    }
    
    console.log("🔐 [FORGOT-PASSWORD] Final reset URL:", resetUrl.substring(0, 100) + '...');
    console.log("🔐 [FORGOT-PASSWORD] Clean base URL for logo:", cleanBaseUrl);

    // Ensure email is branded as Soradin
    // RESEND_FROM_EMAIL should be set in Vercel (e.g., "noreply@soradin.com")
    let fromEmail = process.env.RESEND_FROM_EMAIL || "Soradin <notifications@soradin.com>";
    
    // If it's just an email address, wrap it with "Soradin" name
    if (fromEmail && !fromEmail.includes('<')) {
      fromEmail = `Soradin <${fromEmail}>`;
    } else if (fromEmail && fromEmail.includes('<')) {
      // If it already has a name, replace it with "Soradin" to keep branding consistent
      const emailMatch = fromEmail.match(/<(.+@.+?)>/);
      if (emailMatch) {
        fromEmail = `Soradin <${emailMatch[1]}>`;
      }
    }
    
    console.log("🔐 [FORGOT-PASSWORD] Using from email:", fromEmail);

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

