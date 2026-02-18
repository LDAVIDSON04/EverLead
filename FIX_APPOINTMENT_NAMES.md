# Fix appointment names after bad backfill

## What happened

A migration backfilled `cached_lead_full_name` from each appointment’s lead. When several appointments share the same lead (e.g. same email), that lead’s current name was copied to all of them. So one wrong name (e.g. "Melony Tage" or "Sarah Paul") ended up on multiple meetings.

## Why we can’t auto-restore “what the customer entered”

The name each customer entered was stored only on the **lead** row. When a later booking used the same email, we **overwrote** that lead’s `full_name`. The original name was never stored on the appointment or in notes, so it only existed on the lead and was replaced. There is no other table or backup in the app that has the original name per appointment, so we **cannot** restore it in code or with a migration.

## What we changed

1. **Removed the backfill** from `add_cached_lead_full_name_to_appointments.sql` so it only adds the column and never copies from leads.
2. **Added** `revert_cached_lead_full_name_backfill.sql` to clear `cached_lead_full_name` so we don’t keep showing one wrong name on many rows.

## What you need to do

1. **Run the revert migration** (Supabase SQL Editor or your migration runner):
   - File: `supabase/migrations/revert_cached_lead_full_name_backfill.sql`
   - It runs: `UPDATE public.appointments SET cached_lead_full_name = NULL;`

2. **Set the correct name once per appointment** in Supabase Table Editor:
   - Open **appointments**.
   - For each row, set **cached_lead_full_name** to the **exact name that client/family entered** when they booked (e.g. "Dahnte Nackoney", "Melony Tage", "Sarah Paul" – only on the appointments that are actually for that person).
   - That value is then used for display and is not overwritten when leads are reused. New bookings already set it from the form.

**Optional:** If you have a Supabase backup or point-in-time recovery from before the overwrites, you could restore the **leads** table from that; then each lead would have its original `full_name` again. You’d still need to ensure each appointment points to the correct lead (or use `cached_lead_full_name` as above).
