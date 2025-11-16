// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        if (signUpError || !data.user) {
          console.error(signUpError);
          setError(signUpError?.message || "Failed to sign up.");
          setLoading(false);
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
          setLoading(false);
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
          setLoading(false);
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
          setLoading(false);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">EverLead</h1>
          <p className="text-xs text-slate-500">
            {mode === "login"
              ? "Log in to your agent or admin account"
              : "Create your agent account"}
          </p>
        </div>

        <div className="mb-4 flex rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-3 py-1 ${
              mode === "login"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-3 py-1 ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1 text-sm">
              <label className="block text-slate-700">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="Jane Doe"
                required
              />
            </div>
          )}

          <div className="space-y-1 text-sm">
            <label className="block text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
