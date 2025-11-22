-- Migration: Ensure auction fields exist with correct names
-- Adds auction_starts_at, auction_ends_at, auction_last_bid_at if missing
-- Updates auction_status to support 'open', 'scheduled', 'ended'

DO $$
BEGIN
  -- Add auction_starts_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_starts_at'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_starts_at timestamptz NULL;
    
    -- Copy from auction_start_time if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'auction_start_time'
    ) THEN
      UPDATE public.leads
      SET auction_starts_at = auction_start_time
      WHERE auction_starts_at IS NULL AND auction_start_time IS NOT NULL;
    END IF;
  END IF;

  -- Add auction_ends_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_ends_at'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_ends_at timestamptz NULL;
    
    -- Copy from auction_end_time if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'auction_end_time'
    ) THEN
      UPDATE public.leads
      SET auction_ends_at = auction_end_time
      WHERE auction_ends_at IS NULL AND auction_end_time IS NOT NULL;
    END IF;
  END IF;

  -- Add auction_last_bid_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_last_bid_at'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_last_bid_at timestamptz NULL;
    
    -- Copy from last_bid_at if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'last_bid_at'
    ) THEN
      UPDATE public.leads
      SET auction_last_bid_at = last_bid_at
      WHERE auction_last_bid_at IS NULL AND last_bid_at IS NOT NULL;
    END IF;
  END IF;

  -- Update auction_status to support 'open', 'scheduled', 'ended'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_status'
  ) THEN
    -- Migrate existing status values
    UPDATE leads SET auction_status = 'ended' WHERE auction_status = 'closed';
    UPDATE leads SET auction_status = 'scheduled' WHERE auction_status = 'pending';
    
    -- Drop old constraint if it exists
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_auction_status_check;
    
    -- Add new constraint
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_auction_status_check
      CHECK (auction_status IN ('open', 'scheduled', 'ended'));
  ELSE
    -- Add auction_status if it doesn't exist
    ALTER TABLE public.leads
      ADD COLUMN auction_status text
      CHECK (auction_status IN ('open', 'scheduled', 'ended'))
      DEFAULT 'open';
  END IF;
END $$;

-- Ensure RLS policies allow agents to update auction fields for open auctions
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Agents can update open auction bids" ON public.leads;
  
  -- Create policy for agents to update auction fields
  CREATE POLICY "Agents can update open auction bids"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
    AND auction_status = 'open'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
  );
END $$;

