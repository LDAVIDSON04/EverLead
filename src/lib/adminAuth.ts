/**
 * Client-side only. Use in admin portal to attach auth to API requests.
 * Returns headers object with Authorization: Bearer <token> when session exists.
 */
import { supabaseClient } from "@/lib/supabaseClient";

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}
