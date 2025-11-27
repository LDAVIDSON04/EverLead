-- Add agent_id column to appointments table for booking assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON public.appointments(agent_id);
  END IF;
END $$;

