-- Add 'no_show' status to appointments table
-- First, drop the existing constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new constraint with 'no_show' included
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked'));

