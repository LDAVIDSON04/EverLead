// src/app/api/cron/expire-appointments/route.ts
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
    // Calculate cutoff: 24 hours ago
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Update pending appointments older than 24 hours to 'expired'
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({ 
        status: 'expired', 
        updated_at: new Date().toISOString() 
      })
      .eq('status', 'pending')
      .lt('created_at', cutoff)
      .select('id');

    if (error) {
      console.error('Error expiring appointments:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const expiredCount = data?.length || 0;
    console.log(`✅ Cron job executed: Expired ${expiredCount} appointment(s) older than 24 hours`);

    return NextResponse.json({ 
      success: true, 
      expiredCount,
      timestamp: new Date().toISOString(),
      message: 'Appointments expired successfully',
      version: '0.1.1'
    });
  } catch (err: any) {
    console.error('Unexpected error in expire-appointments cron:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

