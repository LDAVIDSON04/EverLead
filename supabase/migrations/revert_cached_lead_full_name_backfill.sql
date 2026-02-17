-- Revert the bad backfill that copied one lead's name to many appointments.
-- Sets cached_lead_full_name to NULL so we stop showing one wrong name on multiple meetings.
-- After running: In Table Editor, set cached_lead_full_name to the correct client name
-- for each appointment (the name they entered when they booked). That value will then
-- be used for display and never overwritten.
UPDATE public.appointments
SET cached_lead_full_name = NULL;
