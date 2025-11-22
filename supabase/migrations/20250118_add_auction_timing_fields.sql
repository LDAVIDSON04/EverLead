-- Migration: Add auction timing fields with proper naming
-- Adds auction_start_time, auction_end_time, after_hours_release_time
-- Updates auction_status to use 'open', 'closed', 'pending'

DO $$
BEGIN
  -- Add auction_start_time if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_start_time'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_start_time timestamptz NULL;
  END IF;

  -- Add auction_end_time if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_end_time'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN auction_end_time timestamptz NULL;
  END IF;

  -- Add after_hours_release_time if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'after_hours_release_time'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN after_hours_release_time timestamptz NULL;
  END IF;

  -- Update auction_status constraint to use 'open', 'closed', 'pending'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_status'
  ) THEN
    -- Migrate existing status values
    UPDATE leads SET auction_status = 'closed' WHERE auction_status = 'ended';
    UPDATE leads SET auction_status = 'open' WHERE auction_status = 'open' AND auction_status IS NOT NULL;
    UPDATE leads SET auction_status = 'pending' WHERE auction_status = 'pending' OR auction_status IS NULL;
    
    -- Update constraint
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_auction_status_check;
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_auction_status_check
      CHECK (auction_status IN ('open', 'closed', 'pending'));
  ELSE
    -- Add auction_status if it doesn't exist
    ALTER TABLE public.leads
      ADD COLUMN auction_status text
      CHECK (auction_status IN ('open', 'closed', 'pending'))
      DEFAULT 'open';
  END IF;

  -- Ensure winning_agent_id exists (if not already present)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'winning_agent_id'
  ) THEN
    ALTER TABLE public.leads
      ADD COLUMN winning_agent_id uuid NULL;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_winning_agent'
    ) THEN
      ALTER TABLE public.leads
        ADD CONSTRAINT fk_winning_agent
        FOREIGN KEY (winning_agent_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Copy data from old field names to new ones if they exist
DO $$
BEGIN
  -- Migrate auction_start_at -> auction_start_time
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_start_at'
  ) THEN
    UPDATE leads
    SET auction_start_time = auction_start_at
    WHERE auction_start_time IS NULL AND auction_start_at IS NOT NULL;
  END IF;

  -- Migrate auction_ends_at -> auction_end_time
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'auction_ends_at'
  ) THEN
    UPDATE leads
    SET auction_end_time = auction_ends_at
    WHERE auction_end_time IS NULL AND auction_ends_at IS NOT NULL;
  END IF;
END $$;

