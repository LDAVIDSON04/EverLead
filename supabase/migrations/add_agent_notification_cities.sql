-- Add notification_cities column to profiles table
-- This stores an array of cities where the agent wants to receive notifications
-- Format: JSON array of objects with city and province, e.g. [{"city": "Penticton", "province": "BC"}, {"city": "Kelowna", "province": "BC"}]

DO $$
BEGIN
  -- Add notification_cities column as JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'notification_cities'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN notification_cities jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_cities ON public.profiles USING gin (notification_cities);

