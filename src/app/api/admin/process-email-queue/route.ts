// src/app/api/admin/process-email-queue/route.ts
// API route to manually trigger email queue processing
// Can be called by a cron job (Vercel Cron) or manually by admin

import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/emailQueue";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    console.log("📬 Processing email queue...");
    await processEmailQueue();
    
    return NextResponse.json(
      { success: true, message: "Email queue processed" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error processing email queue:", error);
    return NextResponse.json(
      { error: "Failed to process email queue", details: error.message },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(req: NextRequest) {
  return POST(req);
}

