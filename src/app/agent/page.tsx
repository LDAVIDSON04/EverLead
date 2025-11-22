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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        if (signUpError || !data.user) {
          console.error(signUpError);
          setError(signUpError?.message || "Failed to sign up.");
          setSubmitting(false);
          return;
        }

        const userId = data.user.id;

        const { error: profileError } = await supabaseClient
          .from("profiles")
          .insert({
            id: userId,
            full_name: fullName || null,
            role: "agent",
            email,
          });

        if (profileError) {
          console.error(profileError);
          setError("Failed to create profile.");
          setSubmitting(false);
          return;
        }

        router.push("/agent/dashboard");
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
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error(profileError);
          setError("Failed to load profile.");
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
      {/* Header */}
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a4a4a]">
                  Full name
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
                : "Create account"}
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
