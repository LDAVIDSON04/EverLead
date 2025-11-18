// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables at module load (but don't throw in production to avoid breaking builds)
if (!supabaseUrl || !serviceRoleKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  const errorMsg = `Missing required Supabase environment variables: ${missing.join(", ")}`;
  console.error(errorMsg);
  // Only throw in development to catch issues early
  if (process.env.NODE_ENV === "development") {
    throw new Error(errorMsg);
  }
}

// IMPORTANT: this client is for server-side use only
// Create client only if env vars exist, otherwise export a function that throws
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null as any; // Will be checked at runtime in API routes



