-- One-off: set display names for specific appointments (per user request).
-- Agent schedule is in Pacific (America/Vancouver); confirmed_at is stored in UTC.
-- Feb 16 10:00 AM Pacific = 18:00 UTC
-- Feb 17 12:00 PM Pacific = 20:00 UTC
-- Feb 19 09:00 AM Pacific = 17:00 UTC
-- Feb 20 10:00 AM Pacific = 18:00 UTC
UPDATE public.appointments
SET cached_lead_full_name = 'Lee Davidson'
WHERE agent_id = (SELECT id FROM public.profiles WHERE full_name ILIKE '%Liam Davidson%' LIMIT 1)
  AND confirmed_at >= '2026-02-16T18:00:00+00'
  AND confirmed_at <  '2026-02-16T19:00:00+00';

UPDATE public.appointments
SET cached_lead_full_name = 'Shawn Paul'
WHERE agent_id = (SELECT id FROM public.profiles WHERE full_name ILIKE '%Liam Davidson%' LIMIT 1)
  AND confirmed_at >= '2026-02-17T20:00:00+00'
  AND confirmed_at <  '2026-02-17T21:00:00+00';

UPDATE public.appointments
SET cached_lead_full_name = 'Simon Morrisey'
WHERE agent_id = (SELECT id FROM public.profiles WHERE full_name ILIKE '%Liam Davidson%' LIMIT 1)
  AND confirmed_at >= '2026-02-19T17:00:00+00'
  AND confirmed_at <  '2026-02-19T18:00:00+00';

UPDATE public.appointments
SET cached_lead_full_name = 'Nathan Getzlaf'
WHERE agent_id = (SELECT id FROM public.profiles WHERE full_name ILIKE '%Liam Davidson%' LIMIT 1)
  AND confirmed_at >= '2026-02-20T18:00:00+00'
  AND confirmed_at <  '2026-02-20T19:00:00+00';
