-- Migration: Add is_hidden, is_discounted, and price columns to appointments table
-- These fields are used for the unsold appointment discount/hide logic

-- Add is_hidden column (defaults to false for existing appointments)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add is_discounted column (defaults to false for existing appointments)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_discounted BOOLEAN NOT NULL DEFAULT false;

-- Add price column (in dollars, for display purposes)
-- This will be set to 29 for full price, 19 for discounted
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NULL;

-- Set default price for existing appointments (if price_cents exists, convert it)
-- Otherwise default to 29
UPDATE public.appointments
SET price = CASE 
  WHEN price_cents IS NOT NULL THEN price_cents / 100.0
  ELSE 29.00
END
WHERE price IS NULL;

-- Set is_discounted based on price_cents for existing data
UPDATE public.appointments
SET is_discounted = true
WHERE price_cents = 1900 AND is_discounted = false;

-- Set is_hidden for expired appointments
UPDATE public.appointments
SET is_hidden = true
WHERE status = 'expired' AND is_hidden = false;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_is_hidden ON public.appointments(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_appointments_is_discounted ON public.appointments(is_discounted) WHERE is_discounted = true;

-- Add comments
COMMENT ON COLUMN public.appointments.is_hidden IS 'Whether this appointment is hidden from the marketplace (72h+ old)';
COMMENT ON COLUMN public.appointments.is_discounted IS 'Whether this appointment is discounted (48h+ old)';
COMMENT ON COLUMN public.appointments.price IS 'Display price in dollars (29 for full price, 19 for discounted)';

