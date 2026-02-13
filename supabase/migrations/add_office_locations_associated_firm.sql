-- Add associated_firm to office_locations for funeral planners (per-office business/firm name).
-- In-person search shows the firm linked to the matching office; video shows first business name.
ALTER TABLE public.office_locations
ADD COLUMN IF NOT EXISTS associated_firm VARCHAR(255) NULL;

COMMENT ON COLUMN public.office_locations.associated_firm IS 'For funeral planners: business/firm name associated with this office. Used for in-person search display.';
