-- Optional: Geocode existing leads that don't have coordinates
-- This can be run manually or via a script to backfill coordinates for existing leads
-- Note: This requires the Google Maps API and should be run carefully to avoid rate limits

-- First, let's see how many leads need geocoding:
-- SELECT COUNT(*) FROM leads WHERE (latitude IS NULL OR longitude IS NULL) AND city IS NOT NULL AND province IS NOT NULL;

-- To geocode existing leads, you would need to:
-- 1. Create a script that calls the geocoding API for each lead
-- 2. Update the leads table with the coordinates
-- 3. This should be done gradually to avoid API rate limits

-- Example update (you would replace with actual coordinates from geocoding):
-- UPDATE leads 
-- SET latitude = 51.0447, longitude = -114.0719 
-- WHERE id = 'some-lead-id' AND (latitude IS NULL OR longitude IS NULL);

-- For now, new leads will automatically get geocoded when created.
-- Existing leads without coordinates will be excluded from location-based filtering
-- until they are manually geocoded or the lead is updated.

