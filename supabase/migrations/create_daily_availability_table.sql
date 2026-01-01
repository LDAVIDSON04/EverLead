-- Create daily_availability table for one-time date-specific availability
CREATE TABLE IF NOT EXISTS daily_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  location text NOT NULL, -- City name
  date date NOT NULL, -- YYYY-MM-DD
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, location, date)
);

COMMENT ON TABLE daily_availability IS 'One-time date-specific availability (day-only mode)';
COMMENT ON COLUMN daily_availability.location IS 'City name where availability applies';
COMMENT ON COLUMN daily_availability.date IS 'Specific date (YYYY-MM-DD)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_availability_specialist_location ON daily_availability(specialist_id, location);
CREATE INDEX IF NOT EXISTS idx_daily_availability_date ON daily_availability(date);
CREATE INDEX IF NOT EXISTS idx_daily_availability_specialist_date ON daily_availability(specialist_id, date);

-- Enable RLS
ALTER TABLE daily_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can view their own daily availability
CREATE POLICY "Agents can view their own daily availability"
ON daily_availability
FOR SELECT
TO authenticated
USING (
  specialist_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy: Agents can insert their own daily availability
CREATE POLICY "Agents can insert their own daily availability"
ON daily_availability
FOR INSERT
TO authenticated
WITH CHECK (
  specialist_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
);

-- RLS Policy: Agents can update their own daily availability
CREATE POLICY "Agents can update their own daily availability"
ON daily_availability
FOR UPDATE
TO authenticated
USING (
  specialist_id = auth.uid()
)
WITH CHECK (
  specialist_id = auth.uid()
);

-- RLS Policy: Agents can delete their own daily availability
CREATE POLICY "Agents can delete their own daily availability"
ON daily_availability
FOR DELETE
TO authenticated
USING (
  specialist_id = auth.uid()
);

-- RLS Policy: Service role can manage all daily availability
CREATE POLICY "Service role can manage daily availability"
ON daily_availability
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public can view daily availability for active specialists (for booking)
CREATE POLICY "Public can view daily availability for active specialists"
ON daily_availability
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = daily_availability.specialist_id
    AND specialists.is_active = true
  )
);

-- Authenticated users can view daily availability for active specialists
CREATE POLICY "Authenticated users can view daily availability for active specialists"
ON daily_availability
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = daily_availability.specialist_id
    AND specialists.is_active = true
  )
);

