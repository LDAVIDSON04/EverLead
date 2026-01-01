-- Enable Row Level Security (RLS) on specialists table
-- This migration addresses Supabase security issue: Table public.specialists is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all specialists
CREATE POLICY "Admins can view all specialists"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own specialist record
-- Note: specialists.id = profiles.id = auth.uid()
CREATE POLICY "Agents can view their own specialist record"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Public can view active specialists (for booking/search purposes)
-- This allows families to search for and book appointments with specialists
CREATE POLICY "Public can view active specialists"
  ON public.specialists
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Policy: Authenticated users can view active specialists (for booking/search purposes)
CREATE POLICY "Authenticated users can view active specialists"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Agents can insert their own specialist record
CREATE POLICY "Agents can insert their own specialist record"
  ON public.specialists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agent'
    )
  );

-- Policy: Agents can update their own specialist record
CREATE POLICY "Agents can update their own specialist record"
  ON public.specialists
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can delete their own specialist record
CREATE POLICY "Agents can delete their own specialist record"
  ON public.specialists
  FOR DELETE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Service role can manage all specialists (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage specialists"
  ON public.specialists
  FOR ALL
  USING (true)
  WITH CHECK (true);

