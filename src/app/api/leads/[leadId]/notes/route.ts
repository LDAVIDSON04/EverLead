// src/app/api/leads/[leadId]/notes/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: { leadId: string };
};

export async function GET(
  _req: Request,
  { params }: RouteContext
): Promise<Response> {
  const { leadId } = params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Missing leadId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: RouteContext
): Promise<Response> {
  const { leadId } = params;

  if (!leadId) {
    return NextResponse.json(
      { error: "Missing leadId" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const content: string | undefined = body?.content;
  const agentId: string | undefined = body?.agentId;

  if (!content || !content.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("lead_notes")
    .insert({
      lead_id: leadId,
      agent_id: agentId,
      content: content.trim(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error inserting note:", error);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ note: data }, { status: 201 });
}

