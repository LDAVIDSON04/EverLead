-- Migration: Add price_cents column to appointments table
-- This tracks the price paid when an appointment is purchased by an agent

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price_cents INTEGER NULL;

-- Add comment
COMMENT ON COLUMN public.appointments.price_cents IS 'Price paid for this appointment in cents (e.g., 3900 = $39.00). Set when appointment is purchased.';

-- Add index for revenue queries
CREATE INDEX IF NOT EXISTS idx_appointments_price_cents ON public.appointments(price_cents) WHERE price_cents IS NOT NULL;

