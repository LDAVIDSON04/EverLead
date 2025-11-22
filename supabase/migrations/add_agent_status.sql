-- Migration: Add agent_status field to leads table
-- Run this in your Supabase SQL editor

-- Add agent_status column for agent workflow tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS agent_status VARCHAR(50) NULL DEFAULT 'new';

-- Add a check constraint for valid status values (optional)
-- ALTER TABLE leads
-- ADD CONSTRAINT check_agent_status
-- CHECK (agent_status IN ('new', 'contacted', 'in_followup', 'closed_won', 'closed_lost') OR agent_status IS NULL);


