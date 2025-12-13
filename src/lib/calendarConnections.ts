// src/lib/calendarConnections.ts
// Helper functions for managing calendar connections

import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Ensures an ICS connection exists for a specialist and returns the ICS URL
 * @param specialistId - The specialist's ID
 * @returns The full ICS feed URL
 */
export async function ensureIcsConnectionForSpecialist(
  specialistId: string
): Promise<string> {
  // Check if ICS connection already exists
  const { data: existing, error: fetchError } = await supabaseServer
    .from("calendar_connections")
    .select("ics_secret")
    .eq("specialist_id", specialistId)
    .eq("provider", "ics")
    .single();

  let icsSecret: string;

  if (existing && existing.ics_secret) {
    // Reuse existing secret
    icsSecret = existing.ics_secret;
  } else {
    // Generate new secret (cryptographically random)
    // Using Web Crypto API which works in Node.js
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    icsSecret = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    // Create or update the connection
    const { error: upsertError } = await supabaseServer
      .from("calendar_connections")
      .upsert(
        {
          specialist_id: specialistId,
          provider: "ics",
          ics_secret: icsSecret,
          sync_enabled: true,
        },
        {
          onConflict: "specialist_id,provider",
        }
      );

    if (upsertError) {
      console.error("Error creating ICS connection:", upsertError);
      throw new Error("Failed to create ICS connection");
    }
  }

  // Build the ICS URL
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const icsUrl = `${baseUrl}/api/ics/${specialistId}?token=${icsSecret}`;

  return icsUrl;
}

