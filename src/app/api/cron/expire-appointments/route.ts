// src/app/api/cron/expire-appointments/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { headers } from 'next/headers';

export async function GET() {
  // Verify this is a cron request (Vercel adds a header or use CRON_SECRET)
  const authHeader = process.env.CRON_SECRET;
  const requestSecret = headers().get('authorization');
  
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
    console.log(`Expired ${expiredCount} appointment(s) older than 24 hours`);

    return NextResponse.json({ 
      success: true, 
      expiredCount 
    });
  } catch (err: any) {
    console.error('Unexpected error in expire-appointments cron:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

