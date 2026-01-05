-- Migration: Update appointments_agent_id_fkey to allow CASCADE delete
-- This allows deleting agent profiles, which will automatically delete their appointments
-- 
-- WARNING: This will cause appointments to be deleted when an agent profile is deleted.
-- If you prefer to keep appointments and just set agent_id to NULL, use SET NULL instead.
-- 
-- To delete a specific agent's appointments first (before this migration), run:
-- DELETE FROM appointments WHERE agent_id = 'AGENT_ID_HERE';

-- First, drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_agent_id_fkey'
  ) THEN
    ALTER TABLE public.appointments 
    DROP CONSTRAINT appointments_agent_id_fkey;
  END IF;
END $$;

-- Recreate the constraint with CASCADE delete
-- This means when an agent profile is deleted, all their appointments will be deleted too
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_agent_id_fkey
FOREIGN KEY (agent_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Alternative: If you prefer to keep appointments and just set agent_id to NULL instead of deleting:
-- ALTER TABLE public.appointments
-- ADD CONSTRAINT appointments_agent_id_fkey
-- FOREIGN KEY (agent_id)
-- REFERENCES public.profiles(id)
-- ON DELETE SET NULL;

