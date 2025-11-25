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
    // Check if we have a valid reset token in the URL (from query params or hash)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    // Also check hash for Supabase redirects
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (token || (type === "recovery" && accessToken)) {
      // Token is valid, user can reset password
      setLoading(false);
    } else {
      // No valid token, redirect to login
      setError("Invalid or expired reset link. Please request a new password reset.");
      setLoading(false);
      setTimeout(() => {
        router.push("/agent");
      }, 3000);
    }
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
      // Get the token from URL query params or hash
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");

      // If we have a token in query params, exchange it for a session
      if (token) {
        // Exchange the token for a session
        const { data, error: exchangeError } = await supabaseClient.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });

        if (exchangeError) {
          setError(exchangeError.message || "Invalid or expired reset link. Please request a new password reset.");
          setSubmitting(false);
          return;
        }
      } else if (accessToken) {
        // Handle Supabase redirect format
        const { error: verifyError } = await supabaseClient.auth.verifyOtp({
          token_hash: accessToken,
          type: 'recovery',
        });

        if (verifyError) {
          setError(verifyError.message || "Invalid or expired reset link. Please request a new password reset.");
          setSubmitting(false);
          return;
        }
      } else {
        setError("Invalid reset link. Please request a new password reset.");
        setSubmitting(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to reset password. Please try again.");
        setSubmitting(false);
        return;
      }

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

