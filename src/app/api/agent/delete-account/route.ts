import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// Delete Agent Account API
// This endpoint permanently deletes an agent's account and all associated data

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentId = user.id;

    // Verify the user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', agentId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'agent') {
      return NextResponse.json(
        { error: 'Not an agent account' },
        { status: 403 }
      );
    }

    // Delete all related data in the correct order (respecting foreign key constraints)
    // Note: Appointments will cascade delete due to ON DELETE CASCADE on agent_id
    // Tables calendar_connections, daily_availability, external_events use specialist_id (= agent user id)

    // 1. Delete calendar connections (table uses specialist_id, not agent_id)
    try {
      await supabaseAdmin
        .from('calendar_connections')
        .delete()
        .eq('specialist_id', agentId);
    } catch (err) {
      console.warn('Error deleting calendar connections (may not exist):', err);
    }

    // 2. Delete external events (Google/Microsoft calendar events we imported) so they don't appear for a new account
    try {
      await supabaseAdmin
        .from('external_events')
        .delete()
        .eq('specialist_id', agentId);
    } catch (err) {
      console.warn('Error deleting external events (may not exist):', err);
    }

    // 3. Delete deleted-event blocklist for this specialist
    try {
      await supabaseAdmin
        .from('deleted_external_event_sync_blocklist')
        .delete()
        .eq('specialist_id', agentId);
    } catch (err) {
      console.warn('Error deleting blocklist (may not exist):', err);
    }

    // 4. Delete office locations
    try {
      await supabaseAdmin
        .from('office_locations')
        .delete()
        .eq('agent_id', agentId);
    } catch (err) {
      console.warn('Error deleting office locations (may not exist):', err);
    }

    // 5. Delete daily availability (table uses specialist_id)
    try {
      await supabaseAdmin
        .from('daily_availability')
        .delete()
        .eq('specialist_id', agentId);
    } catch (err) {
      console.warn('Error deleting daily availability (may not exist):', err);
    }

    // 6. Update leads that were assigned to this agent (set assigned_agent_id to null)
    // We don't delete leads as they may be needed for business records
    try {
      await supabaseAdmin
        .from('leads')
        .update({ assigned_agent_id: null })
        .eq('assigned_agent_id', agentId);
    } catch (err) {
      console.warn('Error updating leads:', err);
    }

    // 7. Delete the profile (this will cascade delete appointments due to foreign key constraint)
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', agentId);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // 8. Delete the auth user
    // Note: This requires admin privileges and may need to be done via Supabase Admin API
    // For now, we'll rely on the profile deletion and let the user know they need to contact support
    // to fully remove their auth account, or we can use supabaseAdmin.auth.admin.deleteUser()
    try {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(agentId);
      if (deleteUserError) {
        console.warn('Error deleting auth user (may need manual cleanup):', deleteUserError);
        // Don't fail the request - profile is deleted, auth user can be cleaned up separately
      }
    } catch (err) {
      console.warn('Error deleting auth user:', err);
      // Don't fail the request - profile is deleted
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}

