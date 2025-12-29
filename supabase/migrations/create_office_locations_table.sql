-- Migration: Create office_locations table for multiple office locations per agent
-- Run this in your Supabase SQL editor

-- Create office_locations table
CREATE TABLE IF NOT EXISTS office_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Main Office',
  street_address VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS index_office_locations_on_agent_id ON office_locations(agent_id);
CREATE INDEX IF NOT EXISTS index_office_locations_on_display_order ON office_locations(agent_id, display_order);

-- Enable RLS
ALTER TABLE office_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can view their own office locations
CREATE POLICY "Agents can view their own office locations"
ON office_locations
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

-- RLS Policy: Agents can insert their own office locations
CREATE POLICY "Agents can insert their own office locations"
ON office_locations
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
);

-- RLS Policy: Agents can update their own office locations
CREATE POLICY "Agents can update their own office locations"
ON office_locations
FOR UPDATE
TO authenticated
USING (
  agent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
);

-- RLS Policy: Agents can delete their own office locations
CREATE POLICY "Agents can delete their own office locations"
ON office_locations
FOR DELETE
TO authenticated
USING (
  agent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
);

-- RLS Policy: Public can view office locations for approved agents
CREATE POLICY "Public can view office locations for approved agents"
ON office_locations
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = office_locations.agent_id
    AND profiles.role = 'agent'
    AND EXISTS (
      SELECT 1 FROM specialists
      WHERE specialists.specialist_id = office_locations.agent_id
      AND specialists.status = 'approved'
    )
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_office_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_office_locations_updated_at
BEFORE UPDATE ON office_locations
FOR EACH ROW
EXECUTE FUNCTION update_office_locations_updated_at();

