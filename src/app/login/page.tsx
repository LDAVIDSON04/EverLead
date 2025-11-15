// src/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const fullName = String(formData.get("full_name") || "").trim();

    try {
      if (mode === "signup") {
        // 1) SIGN UP
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

        // 2) CREATE PROFILE (open RLS policies should allow this now)
        const { error: profileError } = await supabaseClient
          .from("profiles")
          .insert({
            id: userId,
            full_name: fullName || null,
            role: "agent", // default role
          });

        if (profileError) {
          console.error(profileError);
          setError("Failed to create profile.");
          setLoading(false);
          return;
        }

        // 3) Redirect new user (default agent) to agent dashboard
        router.push("/agent/dashboard");
        return;
      } else {
        // LOGIN MODE
        const { data, error: signInError } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          console.error(signInError);
          setError(signInError.message || "Invalid login credentials.");
          setLoading(false);
          return;
        }

        const user = data.user;
        if (!user) {
          setError("Login succeeded but no user returned.");
          setLoading(false);
          return;
        }

        const userId = user.id;

        // Check profile role to decide where to send them
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          // If no profile for some reason, treat as agent by default
          router.push("/agent/dashboard");
          setLoading(false);
          return;
        }

        const role = (profile?.role as "agent" | "admin") ?? "agent";

        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/agent/dashboard");
        }

        return;
      }
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "400px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>
        {mode === "login" ? "Log in" : "Sign up"}
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {mode === "signup" && (
          <label style={{ fontSize: "14px" }}>
            Full name
            <input
              name="full_name"
              style={{
                display: "block",
                marginTop: "4px",
                width: "100%",
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #E5E7EB",
              }}
            />
          </label>
        )}

        <label style={{ fontSize: "14px" }}>
          Email
          <input
            type="email"
            name="email"
            required
            style={{
              display: "block",
              marginTop: "4px",
              width: "100%",
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid #E5E7EB",
            }}
          />
        </label>

        <label style={{ fontSize: "14px" }}>
          Password
          <input
            type="password"
            name="password"
            required
            style={{
              display: "block",
              marginTop: "4px",
              width: "100%",
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid #E5E7EB",
            }}
          />
        </label>

        {error && (
          <p style={{ color: "#DC2626", fontSize: "14px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "4px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            background: "#2563EB",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Working..."
            : mode === "login"
            ? "Log in"
            : "Create account"}
        </button>
      </form>

      <button
        onClick={() =>
          setMode((m) => (m === "login" ? "signup" : "login"))
        }
        style={{
          marginTop: "12px",
          fontSize: "13px",
          color: "#2563EB",
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {mode === "login"
          ? "Need an account? Sign up"
          : "Already have an account? Log in"}
      </button>
    </div>
  );
}
