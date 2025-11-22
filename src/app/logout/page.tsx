// src/app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error("Error during logout:", err);
      } finally {
        router.replace("/"); // always send back home
      }
    }

    doLogout();
  }, [router]);

  return <p>Signing you out…</p>;
}




