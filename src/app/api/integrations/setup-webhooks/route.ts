// src/app/api/integrations/setup-webhooks/route.ts
// Utility endpoint to set up missing webhooks for existing calendar connections
// Can be called manually or via cron to ensure all connections have webhooks

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setupGoogleWebhook, setupMicrosoftWebhook } from "@/lib/calendarWebhooks";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST: Set up webhooks for connections that are missing them
 * Optional query params:
 * - specialistId: Only set up webhooks for a specific specialist
 * - force: Force re-setup even if webhooks exist (useful for renewal)
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");
    const force = searchParams.get("force") === "true";

    // Build query for connections that need webhooks
    let query = supabaseAdmin
      .from("calendar_connections")
      .select("*")
      .eq("sync_enabled", true)
      .in("provider", ["google", "microsoft"]);

    if (specialistId) {
      query = query.eq("specialist_id", specialistId);
    }

    // If not forcing, only get connections missing webhooks
    if (!force) {
      query = query.or(
        "webhook_channel_id.is.null,webhook_subscription_id.is.null,webhook_expires_at.is.null"
      );
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error("Error loading calendar connections:", error);
      return NextResponse.json(
        { error: "Failed to load calendar connections" },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: "No connections need webhook setup",
        setup: 0,
        total: 0,
      });
    }

    const results = {
      setup: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Set up webhooks for each connection
    for (const connection of connections as CalendarConnection[]) {
      try {
        if (connection.provider === "google") {
          await setupGoogleWebhook(connection);
          results.setup++;
          console.log(
            `✅ Set up Google webhook for specialist ${connection.specialist_id}`
          );
        } else if (connection.provider === "microsoft") {
          await setupMicrosoftWebhook(connection);
          results.setup++;
          console.log(
            `✅ Set up Microsoft webhook for specialist ${connection.specialist_id}`
          );
        }
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to set up ${connection.provider} webhook for specialist ${connection.specialist_id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return NextResponse.json({
      message: "Webhook setup completed",
      setup: results.setup,
      failed: results.failed,
      total: connections.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in /api/integrations/setup-webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Check webhook status for all connections
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");

    let query = supabaseAdmin
      .from("calendar_connections")
      .select("id, specialist_id, provider, webhook_channel_id, webhook_subscription_id, webhook_expires_at, sync_enabled")
      .eq("sync_enabled", true)
      .in("provider", ["google", "microsoft"]);

    if (specialistId) {
      query = query.eq("specialist_id", specialistId);
    }

    const { data: connections, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to load calendar connections" },
        { status: 500 }
      );
    }

    const now = new Date();
    const status = {
      total: connections?.length || 0,
      withWebhooks: 0,
      missingWebhooks: 0,
      expiredWebhooks: 0,
      connections: connections?.map((conn: any) => {
        const hasWebhook =
          conn.provider === "google"
            ? !!conn.webhook_channel_id
            : !!conn.webhook_subscription_id;
        const isExpired =
          conn.webhook_expires_at &&
          new Date(conn.webhook_expires_at) < now;

        if (hasWebhook) {
          status.withWebhooks++;
        } else {
          status.missingWebhooks++;
        }

        if (isExpired) {
          status.expiredWebhooks++;
        }

        return {
          id: conn.id,
          specialist_id: conn.specialist_id,
          provider: conn.provider,
          hasWebhook,
          isExpired,
          expiresAt: conn.webhook_expires_at,
        };
      }),
    };

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Error in /api/integrations/setup-webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

