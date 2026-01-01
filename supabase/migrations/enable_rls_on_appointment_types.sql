-- Enable Row Level Security (RLS) on appointment_types table
-- This migration addresses Supabase security issue: Table public.appointment_types is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all appointment types
CREATE POLICY "Admins can view all appointment types"
  ON public.appointment_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own appointment types
-- Note: appointment_types uses specialist_id which maps to agent_id (auth.uid())
CREATE POLICY "Agents can view their own appointment types"
  ON public.appointment_types
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

-- Policy: Public can view appointment types for active specialists (for booking/search purposes)
-- This allows families to see what appointment types are available when booking
CREATE POLICY "Public can view appointment types for active specialists"
  ON public.appointment_types
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.specialists
      WHERE specialists.id = appointment_types.specialist_id
      AND specialists.is_active = true
    )
  );

-- Policy: Authenticated users can view appointment types for active specialists (for booking/search purposes)
CREATE POLICY "Authenticated users can view appointment types for active specialists"
  ON public.appointment_types
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM public.specialists
        WHERE specialists.id = appointment_types.specialist_id
        AND specialists.is_active = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can insert their own appointment types
CREATE POLICY "Agents can insert their own appointment types"
  ON public.appointment_types
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

-- Policy: Agents can update their own appointment types
CREATE POLICY "Agents can update their own appointment types"
  ON public.appointment_types
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

-- Policy: Agents can delete their own appointment types
CREATE POLICY "Agents can delete their own appointment types"
  ON public.appointment_types
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

-- Policy: Service role can manage all appointment types (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage appointment types"
  ON public.appointment_types
  FOR ALL
  USING (true)
  WITH CHECK (true);

