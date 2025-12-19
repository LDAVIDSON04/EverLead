-- Optional: Backfill confirmed_at for existing confirmed appointments
-- This sets confirmed_at = created_at for appointments that are confirmed but don't have confirmed_at
-- WARNING: This is approximate - we can't know the exact booking time for old appointments
-- Only run this if you want to block slots for existing confirmed appointments

-- For confirmed appointments without confirmed_at, set it to created_at
-- This is approximate but better than nothing
UPDATE public.appointments
SET confirmed_at = created_at
WHERE status = 'confirmed' 
  AND confirmed_at IS NULL
  AND created_at IS NOT NULL;

-- Note: This will make old appointments block slots, but it's approximate
-- New bookings will have the exact time in confirmed_at
