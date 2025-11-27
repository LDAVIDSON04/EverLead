-- Add home_region column to profiles table for region-based appointment filtering
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS home_region text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.home_region IS 'Agent home region (e.g., okanagan). Used to filter available appointments by region.';

