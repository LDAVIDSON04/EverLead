// src/app/agent/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AgentLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
              Agent Portal
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
      <section className="mx-auto max-w-2xl px-6 py-24 md:py-32">
        <div className="text-center">
          <h1
            className="mb-6 text-4xl font-normal leading-tight text-[#2a2a2a] md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Soradin Agent Portal
          </h1>
          <p className="mb-10 mx-auto max-w-xl text-base leading-relaxed text-[#4a4a4a] md:text-lg">
            Licensed funeral professionals can log in here to access exclusive pre-need inquiries in their service area.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-full bg-[#2a2a2a] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#3a3a3a] transition-colors sm:w-auto"
            >
              Log in
            </Link>
            <a
              href="mailto:info@soradin.com?subject=Agent%20access%20request"
              className="w-full text-center rounded-full border border-slate-300 bg-white px-8 py-3 text-base text-slate-700 shadow-sm hover:bg-slate-50 transition-colors sm:w-auto"
            >
              Request access
            </a>
          </div>
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
