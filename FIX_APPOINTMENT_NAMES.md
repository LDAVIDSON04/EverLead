# Fix appointment names after bad backfill

## What happened

A migration backfilled `cached_lead_full_name` from each appointment’s lead. When several appointments share the same lead (e.g. same email), that lead’s current name was copied to all of them. So one wrong name (e.g. "Melony Tage" or "Sarah Paul") ended up on multiple meetings.

## What we changed

1. **Removed the backfill** from `add_cached_lead_full_name_to_appointments.sql` so it only adds the column and never copies from leads.
2. **Added** `revert_cached_lead_full_name_backfill.sql` to clear `cached_lead_full_name` for all appointments so we don’t keep showing one wrong name on many rows.

## What you need to do

1. **Run the revert migration** (in Supabase SQL Editor or via your migration runner):
   - File: `supabase/migrations/revert_cached_lead_full_name_backfill.sql`
   - It runs: `UPDATE public.appointments SET cached_lead_full_name = NULL;`

2. **Set the correct name per appointment** in Supabase Table Editor:
   - Open **appointments**.
   - For each row, set **cached_lead_full_name** to the **exact name that client/family entered** when they booked (e.g. "Dahnte Nackoney", "Melony Tage", "Sarah Paul" – only on the appointments that are actually for that person).
   - Leave it NULL if you’re fine with the name coming from the lead.

After that, the schedule will show whatever you set in `cached_lead_full_name` for each appointment, and that value is not overwritten when leads are reused. New bookings will keep setting it correctly from the form.
