// Public list of marketplace-ready agents for the home page carousel:
// approved, profile photo, not paused, has availability, saved card on Stripe customer.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FeaturedAgent = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  specialty: string | null;
  profile_picture_url: string | null;
  funeral_home: string | null;
  agent_city: string | null;
  agent_province: string | null;
};

function hasVideoSchedule(videoSchedule: unknown): boolean {
  const vs = videoSchedule as Record<string, { enabled?: boolean }> | null | undefined;
  if (!vs || typeof vs !== "object" || Object.keys(vs).length === 0) return false;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return days.some((day) => vs[day]?.enabled === true);
}

async function stripeCustomerHasCard(customerId: string): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as { deleted?: boolean }).deleted) return false;
    const pm = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });
    return pm.data.length > 0;
  } catch {
    return false;
  }
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province, metadata, approval_status"
      )
      .eq("role", "agent");

    if (error) {
      console.error("[FEATURED AGENTS] profiles error:", error);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    type Pending = FeaturedAgent & { stripeCustomerId: string };
    const pending: Pending[] = [];

    for (const profile of profiles || []) {
      const p = profile as {
        id: string;
        full_name: string | null;
        job_title: string | null;
        profile_picture_url: string | null;
        funeral_home: string | null;
        agent_city: string | null;
        agent_province: string | null;
        approval_status: string | null;
        metadata: unknown;
      };

      if (p.approval_status !== "approved") continue;

      let metadata: Record<string, unknown> = {};
      try {
        if (typeof p.metadata === "string") metadata = JSON.parse(p.metadata);
        else if (p.metadata && typeof p.metadata === "object") metadata = p.metadata as Record<string, unknown>;
      } catch {
        metadata = {};
      }

      if (metadata.paused_account === true) continue;

      const pic = p.profile_picture_url;
      if (!pic || !String(pic).trim()) continue;

      const availability = (metadata.availability as Record<string, unknown>) || {};
      const availabilityByLocation = (availability.availabilityByLocation as Record<string, unknown>) || {};
      const videoSchedule = availability.videoSchedule;
      const hasInPerson = Object.keys(availabilityByLocation).length > 0;
      const hasVideo = hasVideoSchedule(videoSchedule);
      if (!hasInPerson && !hasVideo) continue;

      const stripeCustomerId = String((metadata as { stripe_customer_id?: string }).stripe_customer_id || "").trim();
      if (!stripeCustomerId) continue;

      const specialty = (metadata.specialty as string) || null;

      pending.push({
        id: p.id,
        full_name: p.full_name,
        job_title: p.job_title,
        specialty,
        profile_picture_url: p.profile_picture_url,
        funeral_home: p.funeral_home,
        agent_city: p.agent_city,
        agent_province: p.agent_province,
        stripeCustomerId,
      });
    }

    const paymentCache = new Map<string, Promise<boolean>>();
    const checks = await Promise.all(
      pending.map(async (row) => {
        let p = paymentCache.get(row.stripeCustomerId);
        if (!p) {
          p = stripeCustomerHasCard(row.stripeCustomerId);
          paymentCache.set(row.stripeCustomerId, p);
        }
        const ok = await p;
        return { row, ok };
      })
    );

    const candidates: FeaturedAgent[] = checks
      .filter((c) => c.ok)
      .map(({ row }) => {
        const { stripeCustomerId: _, ...agent } = row;
        return agent;
      });

    shuffleInPlace(candidates);

    return NextResponse.json({ agents: candidates });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[FEATURED AGENTS]", e);
    return NextResponse.json({ error: "Internal server error", message: msg }, { status: 500 });
  }
}
