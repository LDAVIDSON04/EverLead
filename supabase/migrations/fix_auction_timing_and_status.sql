-- Migration: Fix auction timing and status values
-- Changes auction_status from 'pending'/'expired'/'sold_*' to 'scheduled'/'open'/'closed'
-- Adds last_bid_at column for tracking

-- Add last_bid_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'last_bid_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_bid_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Update existing auction_status values to new schema
-- 'pending' -> 'scheduled'
-- 'expired' -> 'closed' (if no winner)
-- 'sold_auction' -> 'closed' (if has winner)
-- 'sold_buy_now' -> keep as is (handled separately)
DO $$
BEGIN
  -- Update pending to scheduled
  UPDATE leads 
  SET auction_status = 'scheduled'
  WHERE auction_status = 'pending';
  
  -- Update expired to closed (no winner)
  UPDATE leads 
  SET auction_status = 'closed'
  WHERE auction_status = 'expired' AND winning_agent_id IS NULL;
  
  -- Update sold_auction to closed (has winner)
  UPDATE leads 
  SET auction_status = 'closed'
  WHERE auction_status = 'sold_auction' AND winning_agent_id IS NOT NULL;
  
  -- Ensure open auctions that have passed end time are closed
  UPDATE leads 
  SET auction_status = 'closed'
  WHERE auction_status = 'open' 
    AND auction_end_at IS NOT NULL 
    AND auction_end_at < NOW()
    AND winning_agent_id IS NULL;
  
  -- Ensure open auctions with winners are closed
  UPDATE leads 
  SET auction_status = 'closed'
  WHERE auction_status = 'open' 
    AND winning_agent_id IS NOT NULL;
END $$;

-- Ensure all required questionnaire columns exist (fix for database error)
DO $$
BEGIN
  -- Check and add any missing questionnaire columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN first_name TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_name TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE leads ADD COLUMN address_line1 TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'age'
  ) THEN
    ALTER TABLE leads ADD COLUMN age INTEGER NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'sex'
  ) THEN
    ALTER TABLE leads ADD COLUMN sex TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'planning_for'
  ) THEN
    ALTER TABLE leads ADD COLUMN planning_for TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE leads ADD COLUMN service_type TEXT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'timeline_intent'
  ) THEN
    ALTER TABLE leads ADD COLUMN timeline_intent TEXT NULL;
  END IF;
END $$;

