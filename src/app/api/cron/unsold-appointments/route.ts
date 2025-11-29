// src/app/api/cron/unsold-appointments/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

export async function GET() {
  // Verify this is a cron request (Vercel adds a header or use CRON_SECRET)
  const authHeader = process.env.CRON_SECRET;
  const headersList = await headers();
  const requestSecret = headersList.get('authorization');
  
  // Only enforce CRON_SECRET if it's explicitly set (for manual testing)
  if (authHeader && requestSecret !== `Bearer ${authHeader}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Database configuration error' },
      { status: 500 }
    );
  }

  try {
    // 48h ago & 72h ago cutoffs
    const now = Date.now();
    const cutoff48 = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const cutoff72 = new Date(now - 72 * 60 * 60 * 1000).toISOString();

    // 1) Discount logic: still visible, not discounted, older than 48h, status = pending
    // Update price_cents to 1900 ($19) for appointments older than 48h that are still pending
    // Only discount if price is still at full price (2900) or null, and between 48h-72h old
    const { data: discountData, error: discountError } = await supabaseAdmin
      .from('appointments')
      .update({
        price_cents: 1900, // $19.00 discounted price
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .is('agent_id', null)
      .lt('created_at', cutoff48)
      .gte('created_at', cutoff72) // Between 48h and 72h (not yet hidden)
      .or('price_cents.is.null,price_cents.eq.2900') // Only update if not already discounted
      .select('id');

    const discountedCount = discountData?.length || 0;

    // 2) Hide logic: still visible (even if discounted), older than 72h, status = pending
    // Mark as expired to hide them (they won't show in available appointments query)
    const { data: hideData, error: hideError } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .is('agent_id', null)
      .lt('created_at', cutoff72)
      .select('id');

    const hiddenCount = hideData?.length || 0;

    const success = !discountError && !hideError;

    if (success) {
      console.log(`✅ Unsold appointments cron: Discounted ${discountedCount}, Hidden ${hiddenCount}`);
    } else {
      console.error('❌ Unsold appointments cron errors:', {
        discountError: discountError?.message || discountError,
        hideError: hideError?.message || hideError,
      });
    }

    return NextResponse.json({
      success,
      discountedCount,
      hiddenCount,
      discountError: discountError ? (discountError.message || JSON.stringify(discountError)) : null,
      hideError: hideError ? (hideError.message || JSON.stringify(hideError)) : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Unexpected error in unsold-appointments cron:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

