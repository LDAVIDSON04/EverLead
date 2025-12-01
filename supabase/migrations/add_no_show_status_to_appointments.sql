-- Migration: Add 'no_show' status to appointments table
-- This allows appointments to be marked as 'no_show' in addition to the existing statuses

-- Drop the existing check constraint
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the new check constraint that includes 'no_show'
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked'));
