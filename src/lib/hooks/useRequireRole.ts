// src/lib/hooks/useRequireRole.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type Role = "agent" | "admin";

export function useRequireRole(requiredRole: Role) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        // 1) Check auth user
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const userId = user.id;

        // 2) Load profile + role
        const { data: profile, error } = await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile for role check:", error);
          router.push("/login");
          return;
        }

        const role = (profile?.role as Role) ?? "agent";

        if (role !== requiredRole) {
          // If they're the wrong role, send them to their own dashboard
          router.push(role === "admin" ? "/admin/dashboard" : "/agent/dashboard");
          return;
        }

        setOk(true);
        setLoading(false);
      } catch (err) {
        console.error("Error in useRequireRole:", err);
        router.push("/login");
      }
    }

    check();
  }, [router, requiredRole]);

  return { loading, ok };
}

