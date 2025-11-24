// src/app/agent/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type Mode = "login" | "signup";

export default function AgentLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [licensedInProvince, setLicensedInProvince] = useState<"yes" | "no" | "">("");
  const [licensedFuneralDirector, setLicensedFuneralDirector] = useState<"yes" | "no" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (user) {
          // User is authenticated, check if they're an agent
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const role = profile?.role;

          // If agent, redirect to dashboard; if admin, redirect to admin dashboard
          if (role === "agent") {
            router.push("/agent/dashboard");
            return;
          } else if (role === "admin") {
            router.push("/admin/dashboard");
            return;
          }
        }

        // Not authenticated or not an agent/admin, show the portal page
        setLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        // Validate all required fields
        if (!fullName || !email || !password || !phone || !funeralHome || !licensedInProvince || !licensedFuneralDirector) {
          setError("Please fill in all required fields.");
          setSubmitting(false);
          return;
        }

        // Call API route for signup
        const response = await fetch("/api/agent/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone,
            funeral_home: funeralHome,
            licensed_in_province: licensedInProvince === "yes",
            licensed_funeral_director: licensedFuneralDirector === "yes",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Show user-friendly error message
          let errorMessage = data.error || "Failed to create account. Please try again.";
          
          // Include details if available (for debugging)
          if (data.details && process.env.NODE_ENV === "development") {
            errorMessage += ` (${data.details})`;
          }
          
          console.error("Signup error:", {
            status: response.status,
            error: data.error,
            details: data.details,
            fullResponse: data,
          });
          
          setError(errorMessage);
          setSubmitting(false);
          return;
        }

        // Show success modal
        setShowSuccessModal(true);
        setSubmitting(false);
        
        // Reset form
        setFullName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setFuneralHome("");
        setLicensedInProvince("");
        setLicensedFuneralDirector("");
      } else {
        const { data, error: signInError } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError || !data.user) {
          console.error(signInError);
          setError(signInError?.message || "Invalid login credentials.");
          setSubmitting(false);
          return;
        }

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("role, approval_status")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error(profileError);
          setError("Failed to load profile.");
          setSubmitting(false);
          return;
        }

        // Check approval status for agents
        if (profile.role === "agent" && profile.approval_status !== "approved") {
          setError("Your account is pending approval. You will receive an email when your account is approved.");
          setSubmitting(false);
          return;
        }

        if (profile.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/agent/dashboard");
        }
      }
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

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#2a2a2a]">
      {/* Public Header - No logout button */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex flex-col">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#2a2a2a]">
              Soradin
            </Link>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b] mt-0.5">
              For professionals
            </span>
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/"
              className="text-xs text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
            >
              For families
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h1
            className="mb-4 text-4xl font-normal leading-tight text-[#2a2a2a] md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Soradin for funeral professionals
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#4a4a4a] md:text-lg">
            Soradin helps you connect with pre-need families in your area through high-quality, exclusive leads.
          </p>
        </div>

        {/* Login/Signup Form */}
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex rounded-full bg-[#f7f4ef] p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 rounded-full px-4 py-2 transition-colors ${
                mode === "login"
                  ? "bg-white text-[#2a2a2a] shadow-sm"
                  : "text-[#6b6b6b] hover:text-[#2a2a2a]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setShowSuccessModal(false);
              }}
              className={`flex-1 rounded-full px-4 py-2 transition-colors ${
                mode === "signup"
                  ? "bg-white text-[#2a2a2a] shadow-sm"
                  : "text-[#6b6b6b] hover:text-[#2a2a2a]"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a4a4a]">
                      Full name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a4a4a]">
                      Phone number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a4a4a]">
                      Funeral home or agency *
                    </label>
                    <input
                      type="text"
                      value={funeralHome}
                      onChange={(e) => setFuneralHome(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                      placeholder="Smith Funeral Home"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a4a4a]">
                      Are you licensed in your province? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="licensed_in_province"
                          value="yes"
                          checked={licensedInProvince === "yes"}
                          onChange={(e) => setLicensedInProvince(e.target.value as "yes" | "no")}
                          className="text-[#2a2a2a]"
                          required
                        />
                        <span className="text-sm text-[#4a4a4a]">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="licensed_in_province"
                          value="no"
                          checked={licensedInProvince === "no"}
                          onChange={(e) => setLicensedInProvince(e.target.value as "yes" | "no")}
                          className="text-[#2a2a2a]"
                          required
                        />
                        <span className="text-sm text-[#4a4a4a]">No</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a4a4a]">
                      Are you a licensed funeral director? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="licensed_funeral_director"
                          value="yes"
                          checked={licensedFuneralDirector === "yes"}
                          onChange={(e) => setLicensedFuneralDirector(e.target.value as "yes" | "no")}
                          className="text-[#2a2a2a]"
                          required
                        />
                        <span className="text-sm text-[#4a4a4a]">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="licensed_funeral_director"
                          value="no"
                          checked={licensedFuneralDirector === "no"}
                          onChange={(e) => setLicensedFuneralDirector(e.target.value as "yes" | "no")}
                          className="text-[#2a2a2a]"
                          required
                        />
                        <span className="text-sm text-[#4a4a4a]">No</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a4a4a]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a4a4a]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                  placeholder="••••••••"
                  required
                />
              </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Submit for approval"}
            </button>

            {mode === "login" && (
              <p className="text-center text-xs text-[#6b6b6b]">
                New to Soradin?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-[#2a2a2a] hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}

              {mode === "signup" && (
                <p className="text-center text-xs text-[#6b6b6b]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-[#2a2a2a] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </form>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a2a2a] mb-2">
                    Thank you for your request
                  </h3>
                  <p className="text-sm text-[#4a4a4a] mb-6">
                    We will get back to you soon. Your account has been submitted for review. 
                    Our team will review your application and you will receive an email notification once 
                    your account has been approved. This typically takes 1-2 business days.
                  </p>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setMode("login");
                    }}
                    className="w-full rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3a3a3a] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded3c2] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-xs text-[#6b6b6b] md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Soradin. Tools for funeral professionals.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-[#2a2a2a] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2a2a2a] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
