-- Migration: Add critical indexes for scalability
-- Purpose: Support thousands of agents and leads with fast queries
-- Date: 2025-01-XX

-- Index for profiles.agent_province (used in notification filtering and lead filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_agent_province 
  ON profiles(agent_province) 
  WHERE agent_province IS NOT NULL;

-- Index for leads.province (used extensively in filtering)
CREATE INDEX IF NOT EXISTS idx_leads_province 
  ON leads(province) 
  WHERE province IS NOT NULL;

-- Index for leads.city (used in filtering)
CREATE INDEX IF NOT EXISTS idx_leads_city 
  ON leads(city) 
  WHERE city IS NOT NULL;

-- Composite index for common lead queries (province + assigned status)
CREATE INDEX IF NOT EXISTS idx_leads_province_assigned 
  ON leads(province, assigned_agent_id) 
  WHERE province IS NOT NULL;

-- Index for leads.assigned_agent_id (if not already exists)
-- This is critical for "My Leads" queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_leads_assigned_agent_id'
  ) THEN
    CREATE INDEX idx_leads_assigned_agent_id 
      ON leads(assigned_agent_id) 
      WHERE assigned_agent_id IS NOT NULL;
  END IF;
END $$;

-- Composite index for available leads queries (unassigned + province)
CREATE INDEX IF NOT EXISTS idx_leads_available_province 
  ON leads(assigned_agent_id, province, created_at DESC) 
  WHERE assigned_agent_id IS NULL;

-- Index for appointments by agent_id (used in dashboard and schedule)
-- Check if exists first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_appointments_agent_id'
  ) THEN
    CREATE INDEX idx_appointments_agent_id 
      ON appointments(agent_id) 
      WHERE agent_id IS NOT NULL;
  END IF;
END $$;

-- Composite index for agent appointments with status
CREATE INDEX IF NOT EXISTS idx_appointments_agent_status_date 
  ON appointments(agent_id, status, requested_date DESC) 
  WHERE agent_id IS NOT NULL;

-- Index for profiles role + approval_status (used in notification query)
CREATE INDEX IF NOT EXISTS idx_profiles_role_approval 
  ON profiles(role, approval_status) 
  WHERE role = 'agent';

-- Composite index for agent location queries (used in notifications)
CREATE INDEX IF NOT EXISTS idx_profiles_agent_location 
  ON profiles(agent_latitude, agent_longitude, agent_province) 
  WHERE role = 'agent' 
    AND approval_status = 'approved' 
    AND agent_latitude IS NOT NULL 
    AND agent_longitude IS NOT NULL;

