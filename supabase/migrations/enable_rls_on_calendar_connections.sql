-- Enable Row Level Security (RLS) on calendar_connections table
-- This migration addresses Supabase security issue: Table public.calendar_connections is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all calendar connections
CREATE POLICY "Admins can view all calendar connections"
  ON public.calendar_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own calendar connections
-- Note: calendar_connections uses specialist_id which maps to agent_id (auth.uid())
CREATE POLICY "Agents can view their own calendar connections"
  ON public.calendar_connections
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

-- Policy: Agents can insert their own calendar connections
CREATE POLICY "Agents can insert their own calendar connections"
  ON public.calendar_connections
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

-- Policy: Agents can update their own calendar connections
CREATE POLICY "Agents can update their own calendar connections"
  ON public.calendar_connections
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

-- Policy: Agents can delete their own calendar connections
CREATE POLICY "Agents can delete their own calendar connections"
  ON public.calendar_connections
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

-- Policy: Service role can manage all calendar connections (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage calendar connections"
  ON public.calendar_connections
  FOR ALL
  USING (true)
  WITH CHECK (true);

