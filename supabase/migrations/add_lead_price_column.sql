-- Migration: Add lead_price column to leads table
-- Date: 2025-01-XX
-- Description: Store fixed price for buy-now-only leads based on urgency

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'lead_price'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN lead_price NUMERIC(10, 2);
  END IF;
END $$;

-- Add index for faster lookups by price
CREATE INDEX IF NOT EXISTS idx_leads_lead_price 
ON public.leads(lead_price) 
WHERE lead_price IS NOT NULL;

