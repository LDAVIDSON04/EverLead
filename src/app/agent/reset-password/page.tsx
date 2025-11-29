"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token/session
    // Supabase recovery links automatically create a session when clicked
    async function checkResetSession() {
      try {
        // First, check if Supabase has automatically created a session from hash fragments
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get("token");
        
        // Check hash for Supabase redirects
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const hashToken = hashParams.get("token");
        const type = hashParams.get("type");

        console.log("🔐 [RESET-PAGE] Checking for session/token:", {
          hasSession: !!session,
          hasQueryToken: !!queryToken,
          hasAccessToken: !!accessToken,
          hasHashToken: !!hashToken,
          type,
          sessionError: sessionError?.message,
        });

        // If we have a session (from hash fragments), we're good
        if (session) {
          console.log("🔐 [RESET-PAGE] Session found, allowing password reset");
          setLoading(false);
          return;
        }

        // If we have a token in query params, try to exchange it for a session
        if (queryToken) {
          console.log("🔐 [RESET-PAGE] Query token found, attempting to exchange for session");
          try {
            // Try to verify the token and get a session
            const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
              token_hash: queryToken,
              type: 'recovery',
            });

            if (verifyError) {
              console.error("🔐 [RESET-PAGE] Token verification failed:", verifyError);
              setError("Invalid or expired reset link. Please request a new password reset.");
              setLoading(false);
              setTimeout(() => {
                router.push("/agent");
              }, 3000);
              return;
            }

            // After verification, check for session again
            const { data: { session: newSession } } = await supabaseClient.auth.getSession();
            if (newSession) {
              console.log("🔐 [RESET-PAGE] Session created from token, allowing password reset");
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error("🔐 [RESET-PAGE] Error exchanging token:", err);
          }
        }

        // If we have hash fragments but no session yet, wait a moment for Supabase to process them
        if ((type === "recovery" && accessToken) || hashToken) {
          console.log("🔐 [RESET-PAGE] Hash fragments found, waiting for session...");
          // Give Supabase a moment to process the hash fragments
          setTimeout(async () => {
            const { data: { session: delayedSession } } = await supabaseClient.auth.getSession();
            if (delayedSession) {
              console.log("🔐 [RESET-PAGE] Session found after delay, allowing password reset");
              setLoading(false);
            } else {
              console.log("🔐 [RESET-PAGE] No session after delay, redirecting to login");
              setError("Invalid or expired reset link. Please request a new password reset.");
              setLoading(false);
              setTimeout(() => {
                router.push("/agent");
              }, 3000);
            }
          }, 500);
          return;
        }

        // No valid token or session found
        console.log("🔐 [RESET-PAGE] No token/session found, redirecting to login");
        setError("Invalid or expired reset link. Please request a new password reset.");
        setLoading(false);
        setTimeout(() => {
          router.push("/agent");
        }, 3000);
      } catch (err) {
        console.error("🔐 [RESET-PAGE] Error checking session:", err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }

    checkResetSession();
  }, [router]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      // Check if we have a valid session (should be created automatically from recovery link)
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError || !session) {
        // No session, try to get one from query token
        const searchParams = new URLSearchParams(window.location.search);
        const queryToken = searchParams.get("token");
        
        if (queryToken) {
          console.log("🔐 [RESET-PAGE] No session, trying to verify query token");
          const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
            token_hash: queryToken,
            type: 'recovery',
          });

          if (verifyError) {
            console.error("🔐 [RESET-PAGE] Token verification error:", verifyError);
            setError(verifyError.message || "Invalid or expired reset link. Please request a new password reset.");
            setSubmitting(false);
            return;
          }

          // Check for session again after verification
          const { data: { session: newSession } } = await supabaseClient.auth.getSession();
          if (!newSession) {
            setError("Could not establish a valid session. Please request a new password reset.");
            setSubmitting(false);
            return;
          }
        } else {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setSubmitting(false);
          return;
        }
      }

      // We should have a session now, update the password
      // Get current user to check if password is the same
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        setError("Could not verify your identity. Please request a new password reset.");
        setSubmitting(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("🔐 [RESET-PAGE] Password update error:", updateError);
        
        // Handle specific error cases
        if (updateError.message?.includes("different from the old password")) {
          setError("Your new password must be different from your current password. Please choose a different password.");
        } else {
          setError(updateError.message || "Failed to reset password. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      // Password updated successfully
      // Sign out to clear any stale sessions
      await supabaseClient.auth.signOut();
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/agent");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a] flex items-center justify-center">
        <p className="text-sm text-[#6b6b6b]">Loading...</p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a] flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-lg border border-[#ded3c2] bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-semibold text-[#2a2a2a]">Password reset successful!</h1>
          <p className="mb-6 text-sm text-[#4a4a4a]">
            Your password has been reset. Redirecting you to login...
          </p>
          <Link
            href="/agent"
            className="inline-block rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] transition-colors"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a] flex items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-light text-[#2a2a2a]">Soradin</h1>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#6b6b6b]">Agent Portal</p>
        </div>

        <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2a2a2a]">Reset your password</h2>
          
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#4a4a4a]">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#4a4a4a]">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
            >
              {submitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[#6b6b6b]">
            <Link href="/agent" className="text-[#2a2a2a] hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a] flex items-center justify-center">
        <p className="text-sm text-[#6b6b6b]">Loading...</p>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

