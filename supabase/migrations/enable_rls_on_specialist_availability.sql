-- Enable Row Level Security (RLS) on specialist_availability table
-- This migration addresses Supabase security issue: Table public.specialist_availability is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.specialist_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all availability records
CREATE POLICY "Admins can view all specialist availability"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own availability records
-- Note: specialist_availability uses specialist_id which maps to agent_id (auth.uid())
CREATE POLICY "Agents can view their own availability"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Public can view availability for active specialists (for booking/search purposes)
-- This allows families to see availability when booking appointments
CREATE POLICY "Public can view availability for active specialists"
  ON public.specialist_availability
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.specialists
      WHERE specialists.id = specialist_availability.specialist_id
      AND specialists.is_active = true
    )
  );

-- Policy: Authenticated users can view availability for active specialists (for booking/search purposes)
CREATE POLICY "Authenticated users can view availability for active specialists"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.specialists
      WHERE specialists.id = specialist_availability.specialist_id
      AND specialists.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can insert their own availability records
CREATE POLICY "Agents can insert their own availability"
  ON public.specialist_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
  );

-- Policy: Agents can update their own availability records
CREATE POLICY "Agents can update their own availability"
  ON public.specialist_availability
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can delete their own availability records
CREATE POLICY "Agents can delete their own availability"
  ON public.specialist_availability
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Service role can manage all availability records (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage specialist availability"
  ON public.specialist_availability
  FOR ALL
  USING (true)
  WITH CHECK (true);

