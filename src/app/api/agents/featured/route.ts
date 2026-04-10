// Public list of agents for the home page carousel:
// approved, not paused, has availability in metadata. Photo and payment method not required.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Home carousel: show BC professionals only until multi-province carousel is enabled. */
function isBritishColumbiaProvince(agentProvince: string | null | undefined): boolean {
  const p = (agentProvince || "").trim().toUpperCase();
  return p === "BC" || p === "BRITISH COLUMBIA";
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

    const candidates: FeaturedAgent[] = [];

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

      const availability = (metadata.availability as Record<string, unknown>) || {};
      const availabilityByLocation = (availability.availabilityByLocation as Record<string, unknown>) || {};
      const videoSchedule = availability.videoSchedule;
      const hasInPerson = Object.keys(availabilityByLocation).length > 0;
      const hasVideo = hasVideoSchedule(videoSchedule);
      if (!hasInPerson && !hasVideo) continue;

      const specialty = (metadata.specialty as string) || null;

      candidates.push({
        id: p.id,
        full_name: p.full_name,
        job_title: p.job_title,
        specialty,
        profile_picture_url: p.profile_picture_url,
        funeral_home: p.funeral_home,
        agent_city: p.agent_city,
        agent_province: p.agent_province,
      });
    }

    const bcOnly = candidates.filter((c) => isBritishColumbiaProvince(c.agent_province));
    shuffleInPlace(bcOnly);

    return NextResponse.json({ agents: bcOnly });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[FEATURED AGENTS]", e);
    return NextResponse.json({ error: "Internal server error", message: msg }, { status: 500 });
  }
}
