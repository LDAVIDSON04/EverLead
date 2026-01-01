-- Enable Row Level Security (RLS) on families table
-- This migration addresses Supabase security issue: Table public.families is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all family records
CREATE POLICY "Admins can view all families"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Families can view their own record
-- Note: families.id = profiles.id = auth.uid()
CREATE POLICY "Families can view their own record"
  ON public.families
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

-- Policy: Agents can view family records
-- Note: Since appointments table uses lead_id (not family_id), we allow agents to view families
-- In practice, family access is typically handled through leads/appointments relationships
-- If you need more restrictive access, you can add additional conditions based on your data model
CREATE POLICY "Agents can view families"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('agent', 'admin')
    )
  );

-- Policy: Families can insert their own record
CREATE POLICY "Families can insert their own record"
  ON public.families
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

-- Policy: Families can update their own record
CREATE POLICY "Families can update their own record"
  ON public.families
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

-- Policy: Admins can delete family records
CREATE POLICY "Admins can delete families"
  ON public.families
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Service role can manage all family records (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage families"
  ON public.families
  FOR ALL
  USING (true)
  WITH CHECK (true);

