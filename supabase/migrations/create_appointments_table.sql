-- Create appointments table for lead booking system
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  requested_window text NOT NULL CHECK (requested_window IN ('morning', 'afternoon', 'evening')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_requested_date ON public.appointments(requested_date);

-- Add comment
COMMENT ON TABLE public.appointments IS 'Appointments for lead booking calls with specialists';

