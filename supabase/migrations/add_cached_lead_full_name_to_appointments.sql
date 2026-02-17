-- Store the client/family name at time of booking so it never changes when a lead is reused/updated.
-- Display uses this when set; otherwise falls back to lead.full_name.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cached_lead_full_name TEXT;

COMMENT ON COLUMN public.appointments.cached_lead_full_name IS 'Client name as entered when the appointment was created/confirmed; prevents display from changing if lead is updated or reused';

-- Do NOT backfill from leads: many appointments share one lead; if that lead's name was
-- overwritten, backfilling would copy one wrong name to many appointments. Leave NULL;
-- display falls back to lead.full_name. New bookings set this on create/confirm.
