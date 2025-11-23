-- Add location fields to profiles table for agent geo-location filtering
-- This allows agents to set their location and search radius

DO $$
BEGIN
  -- Add agent_city
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'agent_city'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN agent_city text;
  END IF;

  -- Add agent_province
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'agent_province'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN agent_province text;
  END IF;

  -- Add agent_latitude (for distance calculations)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'agent_latitude'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN agent_latitude numeric(10, 8);
  END IF;

  -- Add agent_longitude (for distance calculations)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'agent_longitude'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN agent_longitude numeric(11, 8);
  END IF;

  -- Add search_radius_km (default 50km)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'search_radius_km'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN search_radius_km integer DEFAULT 50;
  END IF;
END $$;

