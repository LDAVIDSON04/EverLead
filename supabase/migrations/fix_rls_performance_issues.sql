-- Fix RLS Performance Issues
-- This migration optimizes RLS policies by wrapping auth function calls in SELECT subqueries
-- This prevents re-evaluation for each row, significantly improving query performance at scale

-- ============================================================================
-- Issue 1: leads table - "Authenticated users can insert leads"
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;

CREATE POLICY "Authenticated users can insert leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.role()) = 'authenticated'
  );

-- ============================================================================
-- Issue 2: reviews table - "Authenticated users can submit reviews"
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;

CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.role()) = 'authenticated'
  );

-- ============================================================================
-- Issue 3: reviews table - "Leads can update their own reviews"
-- ============================================================================
DROP POLICY IF EXISTS "Leads can update their own reviews" ON public.reviews;

CREATE POLICY "Leads can update their own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.role()) = 'authenticated'
  )
  WITH CHECK (
    (select auth.role()) = 'authenticated'
  );

-- ============================================================================
-- Issue 4-7: daily_availability table - 4 policies with auth.uid()
-- ============================================================================

-- Policy 1: Agents can view their own daily availability
DROP POLICY IF EXISTS "Agents can view their own daily availability" ON public.daily_availability;

CREATE POLICY "Agents can view their own daily availability"
  ON public.daily_availability
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Policy 2: Agents can insert their own daily availability
DROP POLICY IF EXISTS "Agents can insert their own daily availability" ON public.daily_availability;

CREATE POLICY "Agents can insert their own daily availability"
  ON public.daily_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

-- Policy 3: Agents can update their own daily availability
DROP POLICY IF EXISTS "Agents can update their own daily availability" ON public.daily_availability;

CREATE POLICY "Agents can update their own daily availability"
  ON public.daily_availability
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
  )
  WITH CHECK (
    specialist_id = (select auth.uid())
  );

-- Policy 4: Agents can delete their own daily availability
DROP POLICY IF EXISTS "Agents can delete their own daily availability" ON public.daily_availability;

CREATE POLICY "Agents can delete their own daily availability"
  ON public.daily_availability
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
  );

-- ============================================================================
-- Issue 8: declined_payments table - "Agents can view their own declined payments"
-- ============================================================================
-- Note: If this policy doesn't exist, this will be a no-op
DROP POLICY IF EXISTS "Agents can view their own declined payments" ON public.declined_payments;

-- Only create if the table exists (check via information_schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'declined_payments'
  ) THEN
    CREATE POLICY "Agents can view their own declined payments"
      ON public.declined_payments
      FOR SELECT
      TO authenticated
      USING (
        agent_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- Note on Multiple Permissive Policies
-- ============================================================================
-- The warnings about "multiple permissive policies" for SELECT operations are
-- informational and generally not performance issues. Having multiple SELECT policies
-- is often intentional for different access patterns (e.g., admins vs agents vs public).
-- PostgreSQL evaluates all permissive policies with OR logic, which is usually fine.
--
-- If performance becomes an issue with specific queries, consider:
-- 1. Combining policies where logical (but this reduces clarity)
-- 2. Using restrictive policies instead of multiple permissive ones
-- 3. Adding indexes on columns used in policy conditions
--
-- For now, the multiple policies are kept for clarity and maintainability.
-- The main performance improvement comes from optimizing auth function calls above.

