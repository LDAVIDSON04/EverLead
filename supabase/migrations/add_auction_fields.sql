-- Migration: Add auction fields to leads table and create lead_bids table
-- Run this in your Supabase SQL editor

-- Add auction-related columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS auction_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auction_ends_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS buy_now_price NUMERIC NULL,
ADD COLUMN IF NOT EXISTS current_bid_amount NUMERIC NULL,
ADD COLUMN IF NOT EXISTS current_bid_agent_id UUID NULL;

-- Add foreign key constraint for current_bid_agent_id
-- This references auth.users (adjust if you use a different agents table)
ALTER TABLE leads
ADD CONSTRAINT fk_current_bid_agent
FOREIGN KEY (current_bid_agent_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Create lead_bids table
CREATE TABLE IF NOT EXISTS lead_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for lead_bids
CREATE INDEX IF NOT EXISTS index_lead_bids_on_lead_id ON lead_bids(lead_id);
CREATE INDEX IF NOT EXISTS index_lead_bids_on_agent_id ON lead_bids(agent_id);

-- Enable RLS on lead_bids
ALTER TABLE lead_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can insert bids
CREATE POLICY "Agents can insert bids"
ON lead_bids
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
);

-- RLS Policy: Agents can view their own bids
CREATE POLICY "Agents can view their own bids"
ON lead_bids
FOR SELECT
TO authenticated
USING (
  agent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Note: Service role (used by supabaseAdmin) bypasses RLS automatically


