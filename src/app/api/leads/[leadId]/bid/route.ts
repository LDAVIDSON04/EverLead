// src/app/api/leads/[leadId]/bid/route.ts
// DEPRECATED: Auctions are disabled. Buy-Now-only mode.
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: any): Promise<Response> {
  return NextResponse.json(
    { 
      error: "Auctions temporarily disabled. Buy-Now only.",
      details: "This endpoint is no longer available. Please use the Buy Now button instead."
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}
