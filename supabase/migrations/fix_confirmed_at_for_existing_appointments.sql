-- Fix confirmed_at for existing appointments that have incorrect values
-- This updates appointments where confirmed_at matches created_at (meaning it was set incorrectly)
-- We'll set it to a representative time within the requested_window

UPDATE public.appointments
SET confirmed_at = 
  CASE 
    -- Morning window: set to 9:00 AM on the requested date in UTC (PST is UTC-8, so 9 AM PST = 17:00 UTC)
    WHEN requested_window = 'morning' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '9 hours')::timestamptz
    -- Afternoon window: set to 1:00 PM on the requested date (13:00 PST = 21:00 UTC)
    WHEN requested_window = 'afternoon' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '13 hours')::timestamptz
    -- Evening window: set to 5:00 PM on the requested date (17:00 PST = 01:00 UTC next day)
    WHEN requested_window = 'evening' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '17 hours')::timestamptz
    ELSE confirmed_at
  END
WHERE status = 'confirmed'
  AND confirmed_at IS NOT NULL
  AND confirmed_at = created_at  -- Only fix appointments where confirmed_at was incorrectly set to created_at
  AND requested_date IS NOT NULL;

-- For appointments without confirmed_at, set it based on window (approximate)
UPDATE public.appointments
SET confirmed_at = 
  CASE 
    WHEN requested_window = 'morning' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '9 hours')::timestamptz
    WHEN requested_window = 'afternoon' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '13 hours')::timestamptz
    WHEN requested_window = 'evening' THEN 
      (requested_date::timestamp AT TIME ZONE 'America/Vancouver' + INTERVAL '17 hours')::timestamptz
    ELSE created_at
  END
WHERE status = 'confirmed'
  AND confirmed_at IS NULL
  AND requested_date IS NOT NULL;
