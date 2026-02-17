-- Store the client/family name at time of booking so it never changes when a lead is reused/updated.
-- Display uses this when set; otherwise falls back to lead.full_name.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cached_lead_full_name TEXT;

COMMENT ON COLUMN public.appointments.cached_lead_full_name IS 'Client name as entered when the appointment was created/confirmed; prevents display from changing if lead is updated or reused';

-- Backfill from current lead so existing appointments keep showing the current name.
-- If an appointment was already showing the wrong name (lead overwritten by a later booking),
-- fix it manually: UPDATE appointments SET cached_lead_full_name = 'Correct Name' WHERE id = '<id>';
UPDATE public.appointments a
SET cached_lead_full_name = l.full_name
FROM public.leads l
WHERE a.lead_id = l.id
  AND a.cached_lead_full_name IS NULL
  AND l.full_name IS NOT NULL;
