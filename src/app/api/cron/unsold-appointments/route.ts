// src/app/api/cron/unsold-appointments/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';
import { requireCronSecret } from '@/lib/requireCronSecret';

export async function GET() {
  const headersList = await headers();
  const unauthorized = requireCronSecret(headersList.get('authorization'));
  if (unauthorized) return unauthorized;

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

    // 1) Discount logic: appointments between 48h-72h old, still pending and unsold
    // Set is_discounted = true and price = 19 for appointments older than 48h
    const { data: discountData, error: discountError } = await supabaseAdmin
      .from('appointments')
      .update({
        is_discounted: true,
        price: 19.00,
        price_cents: 1900, // Keep price_cents for backward compatibility
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .is('agent_id', null)
      .eq('is_hidden', false)
      .eq('is_discounted', false)
      .lt('created_at', cutoff48)
      .gte('created_at', cutoff72)
      .select('id');

    const discountedCount = discountData?.length || 0;

    // 2) Hide logic: appointments older than 72h, still pending and unsold
    const { data: hideData, error: hideError } = await supabaseAdmin
      .from('appointments')
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .is('agent_id', null)
      .eq('is_hidden', false)
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

