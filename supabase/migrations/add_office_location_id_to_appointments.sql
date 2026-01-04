-- Migration: Add office_location_id to appointments table
-- This allows appointments to be directly linked to the office location where they were booked

-- Add office_location_id column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS office_location_id UUID REFERENCES public.office_locations(id) ON DELETE SET NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_office_location_id ON public.appointments(office_location_id);

-- Add comment
COMMENT ON COLUMN public.appointments.office_location_id IS 'The office location where this appointment was booked. References office_locations.id.';

