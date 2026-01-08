-- Fix common city name misspellings in office_locations and availability metadata
-- This migration normalizes city names like "Vaughn" to "Vaughan"

-- Function to normalize city names
CREATE OR REPLACE FUNCTION normalize_city_name(city_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF city_name IS NULL OR city_name = '' THEN
    RETURN city_name;
  END IF;
  
  -- Convert to lowercase for comparison
  CASE LOWER(TRIM(city_name))
    WHEN 'vaughn' THEN RETURN 'Vaughan';
    WHEN 'vaughon' THEN RETURN 'Vaughan';
    -- Add more corrections as needed
    ELSE
      -- Return capitalized version
      RETURN INITCAP(TRIM(city_name));
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Fix office_locations table
UPDATE office_locations
SET city = normalize_city_name(city)
WHERE city IS NOT NULL
  AND city != normalize_city_name(city);

-- Fix availability metadata in profiles
-- This updates city names in metadata.availability.locations and availabilityByLocation keys
UPDATE profiles
SET metadata = jsonb_set(
  metadata,
  '{availability,locations}',
  COALESCE(
    (
      SELECT jsonb_agg(normalize_city_name(elem::text))
      FROM jsonb_array_elements_text(metadata->'availability'->'locations') AS elem
    ),
    metadata->'availability'->'locations'
  )
)
WHERE metadata->'availability'->'locations' IS NOT NULL;

-- Fix availabilityByLocation keys
-- Note: This is more complex - we need to rebuild the object with normalized keys
-- For now, we'll create a function to handle this
DO $$
DECLARE
  profile_record RECORD;
  availability_data JSONB;
  availability_by_location JSONB;
  normalized_availability JSONB := '{}';
  old_key TEXT;
  new_key TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, metadata 
    FROM profiles 
    WHERE metadata->'availability'->'availabilityByLocation' IS NOT NULL
  LOOP
    availability_data := profile_record.metadata->'availability';
    availability_by_location := availability_data->'availabilityByLocation';
    normalized_availability := '{}';
    
    -- Rebuild availabilityByLocation with normalized keys
    FOR old_key IN SELECT jsonb_object_keys(availability_by_location)
    LOOP
      new_key := normalize_city_name(old_key);
      normalized_availability := normalized_availability || jsonb_build_object(new_key, availability_by_location->old_key);
    END LOOP;
    
    -- Update the profile with normalized data
    UPDATE profiles
    SET metadata = jsonb_set(
      metadata,
      '{availability,availabilityByLocation}',
      normalized_availability
    )
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Clean up the function (optional - can keep it for future use)
-- DROP FUNCTION normalize_city_name(TEXT);
