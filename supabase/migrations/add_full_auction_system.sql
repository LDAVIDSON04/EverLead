-- Migration: Add full auction system fields to leads table
-- Extends existing auction fields with timezone-aware scheduling

-- Check and add auction_start_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'auction_start_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN auction_start_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Check and add auction_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'auction_status'
  ) THEN
    ALTER TABLE leads ADD COLUMN auction_status TEXT NULL;
    -- Set default for existing leads
    UPDATE leads 
    SET auction_status = CASE 
      WHEN auction_enabled = true AND auction_ends_at IS NOT NULL AND auction_ends_at > NOW() THEN 'open'
      WHEN auction_enabled = true AND auction_ends_at IS NOT NULL AND auction_ends_at <= NOW() THEN 'expired'
      ELSE 'pending'
    END
    WHERE auction_status IS NULL;
  END IF;
END $$;

-- Check and add auction_timezone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'auction_timezone'
  ) THEN
    ALTER TABLE leads ADD COLUMN auction_timezone TEXT NULL;
    -- Set default timezone for existing leads (America/Edmonton as fallback)
    UPDATE leads SET auction_timezone = 'America/Edmonton' WHERE auction_timezone IS NULL;
  END IF;
END $$;

-- Check and add starting_bid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'starting_bid'
  ) THEN
    ALTER TABLE leads ADD COLUMN starting_bid NUMERIC NOT NULL DEFAULT 10;
  END IF;
END $$;

-- Check and add min_increment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'min_increment'
  ) THEN
    ALTER TABLE leads ADD COLUMN min_increment NUMERIC NOT NULL DEFAULT 5;
  END IF;
END $$;

-- Check and add winning_agent_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'winning_agent_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN winning_agent_id UUID NULL;
    -- Add foreign key constraint
    ALTER TABLE leads
    ADD CONSTRAINT fk_winning_agent
    FOREIGN KEY (winning_agent_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Check and add notification_sent_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'notification_sent_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN notification_sent_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Ensure buy_now_price has default if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'buy_now_price'
  ) THEN
    -- Update NULL buy_now_price to 50
    UPDATE leads SET buy_now_price = 50 WHERE buy_now_price IS NULL AND auction_enabled = true;
  END IF;
END $$;

-- Create index on auction_status for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_auction_status ON leads(auction_status) WHERE auction_status IS NOT NULL;

-- Create index on auction_start_at
CREATE INDEX IF NOT EXISTS idx_leads_auction_start_at ON leads(auction_start_at) WHERE auction_start_at IS NOT NULL;

-- Create index on auction_end_at (if not exists)
CREATE INDEX IF NOT EXISTS idx_leads_auction_ends_at ON leads(auction_ends_at) WHERE auction_ends_at IS NOT NULL;

