-- Migration: Add purchased_by_email tracking
-- Date: 2025-11-17
-- Description: Track which email address was used when a lead was purchased

-- Add purchased_by_email column to leads table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'purchased_by_email') THEN
    ALTER TABLE public.leads ADD COLUMN purchased_by_email text;
  END IF;
END $$;

-- Add index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_leads_purchased_by_email 
ON public.leads(purchased_by_email) 
WHERE purchased_by_email IS NOT NULL;


