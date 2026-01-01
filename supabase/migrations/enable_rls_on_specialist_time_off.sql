-- Enable Row Level Security (RLS) on specialist_time_off table
-- This migration addresses Supabase security issue: Table public.specialist_time_off is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.specialist_time_off ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all time off records
CREATE POLICY "Admins can view all specialist time off"
  ON public.specialist_time_off
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own time off records
-- Note: specialist_time_off uses specialist_id which maps to agent_id (auth.uid())
CREATE POLICY "Agents can view their own time off"
  ON public.specialist_time_off
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

-- Policy: Agents can insert their own time off records
CREATE POLICY "Agents can insert their own time off"
  ON public.specialist_time_off
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

-- Policy: Agents can update their own time off records
CREATE POLICY "Agents can update their own time off"
  ON public.specialist_time_off
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

-- Policy: Agents can delete their own time off records
CREATE POLICY "Agents can delete their own time off"
  ON public.specialist_time_off
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

-- Policy: Service role can manage all time off records (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage specialist time off"
  ON public.specialist_time_off
  FOR ALL
  USING (true)
  WITH CHECK (true);

