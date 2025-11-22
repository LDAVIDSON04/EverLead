-- Migration: Add auction timer logic with 'pending' | 'open' | 'ended' status
-- Ensures auction_ends_at is only set after first bid

-- Update auction_status to use 'pending' | 'open' | 'ended'
DO $$
BEGIN
  -- Add auction_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_status'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_status text
      CHECK (auction_status IN ('pending', 'open', 'ended'))
      DEFAULT 'pending';
  ELSE
    -- Update existing status values
    -- 'scheduled' -> 'pending'
    UPDATE leads SET auction_status = 'pending' WHERE auction_status = 'scheduled';
    -- 'closed' -> 'ended'
    UPDATE leads SET auction_status = 'ended' WHERE auction_status = 'closed';
    
    -- Update constraint if it exists
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_auction_status_check;
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_auction_status_check
      CHECK (auction_status IN ('pending', 'open', 'ended'));
  END IF;

  -- Ensure auction_ends_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_ends_at'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_ends_at timestamptz;
  END IF;
END $$;

-- Set auction_ends_at to NULL for leads with no bids yet
UPDATE leads
SET auction_ends_at = NULL
WHERE auction_status = 'pending' OR auction_status = 'open'
  AND current_bid_amount IS NULL;

