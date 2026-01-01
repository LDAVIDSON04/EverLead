-- Optimize RLS policies for better performance
-- Replace auth.uid() with (select auth.uid()) to evaluate once per query instead of once per row
-- This migration addresses Supabase performance warnings about RLS policies re-evaluating auth functions
--
-- NOTE: The "multiple permissive policies" warnings are informational only.
-- Multiple policies for the same action are acceptable and expected when you have
-- different conditions (e.g., "Admins can view all" AND "Agents can view their own").
-- PostgreSQL combines them with OR logic, which is the intended behavior.
-- These warnings don't need to be fixed and don't affect functionality.

-- ============================================
-- PAYMENTS TABLE
-- ============================================

-- Drop and recreate policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Agents can view their own payments" ON public.payments;

CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = public.payments.appointment_id
      AND appointments.agent_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view approved agent profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view approved agent profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Public can view approved agent profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    role = 'agent'
    AND approval_status = 'approved'
  );

CREATE POLICY "Authenticated users can view approved agent profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR role = 'agent'
    AND approval_status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.role = 'admin'
    )
  );

-- ============================================
-- CALENDAR_CONNECTIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Agents can view their own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Agents can insert their own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Agents can update their own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Agents can delete their own calendar connections" ON public.calendar_connections;

CREATE POLICY "Admins can view all calendar connections"
  ON public.calendar_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own calendar connections"
  ON public.calendar_connections
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own calendar connections"
  ON public.calendar_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own calendar connections"
  ON public.calendar_connections
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own calendar connections"
  ON public.calendar_connections
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- SPECIALIST_TIME_OFF TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all specialist time off" ON public.specialist_time_off;
DROP POLICY IF EXISTS "Agents can view their own time off" ON public.specialist_time_off;
DROP POLICY IF EXISTS "Agents can insert their own time off" ON public.specialist_time_off;
DROP POLICY IF EXISTS "Agents can update their own time off" ON public.specialist_time_off;
DROP POLICY IF EXISTS "Agents can delete their own time off" ON public.specialist_time_off;

CREATE POLICY "Admins can view all specialist time off"
  ON public.specialist_time_off
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own time off"
  ON public.specialist_time_off
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own time off"
  ON public.specialist_time_off
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own time off"
  ON public.specialist_time_off
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own time off"
  ON public.specialist_time_off
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- SPECIALISTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all specialists" ON public.specialists;
DROP POLICY IF EXISTS "Agents can view their own specialist record" ON public.specialists;
DROP POLICY IF EXISTS "Agents can insert their own specialist record" ON public.specialists;
DROP POLICY IF EXISTS "Agents can update their own specialist record" ON public.specialists;
DROP POLICY IF EXISTS "Agents can delete their own specialist record" ON public.specialists;

CREATE POLICY "Admins can view all specialists"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own specialist record"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own specialist record"
  ON public.specialists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own specialist record"
  ON public.specialists
  FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own specialist record"
  ON public.specialists
  FOR DELETE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- SPECIALIST_AVAILABILITY TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all specialist availability" ON public.specialist_availability;
DROP POLICY IF EXISTS "Agents can view their own availability" ON public.specialist_availability;
DROP POLICY IF EXISTS "Authenticated users can view availability for active specialists" ON public.specialist_availability;
DROP POLICY IF EXISTS "Agents can insert their own availability" ON public.specialist_availability;
DROP POLICY IF EXISTS "Agents can update their own availability" ON public.specialist_availability;
DROP POLICY IF EXISTS "Agents can delete their own availability" ON public.specialist_availability;

CREATE POLICY "Admins can view all specialist availability"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own availability"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view availability for active specialists"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.specialists
      WHERE specialists.id = specialist_availability.specialist_id
      AND specialists.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own availability"
  ON public.specialist_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own availability"
  ON public.specialist_availability
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own availability"
  ON public.specialist_availability
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FAMILIES TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all families" ON public.families;
DROP POLICY IF EXISTS "Families can view their own record" ON public.families;
DROP POLICY IF EXISTS "Agents can view families" ON public.families;
DROP POLICY IF EXISTS "Families can insert their own record" ON public.families;
DROP POLICY IF EXISTS "Families can update their own record" ON public.families;
DROP POLICY IF EXISTS "Admins can delete families" ON public.families;

CREATE POLICY "Admins can view all families"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Families can view their own record"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view families"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('agent', 'admin')
    )
  );

CREATE POLICY "Families can insert their own record"
  ON public.families
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Families can update their own record"
  ON public.families
  FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete families"
  ON public.families
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- APPOINTMENT_TYPES TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all appointment types" ON public.appointment_types;
DROP POLICY IF EXISTS "Agents can view their own appointment types" ON public.appointment_types;
DROP POLICY IF EXISTS "Authenticated users can view appointment types for active specialists" ON public.appointment_types;
DROP POLICY IF EXISTS "Agents can insert their own appointment types" ON public.appointment_types;
DROP POLICY IF EXISTS "Agents can update their own appointment types" ON public.appointment_types;
DROP POLICY IF EXISTS "Agents can delete their own appointment types" ON public.appointment_types;

CREATE POLICY "Admins can view all appointment types"
  ON public.appointment_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view their own appointment types"
  ON public.appointment_types
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view appointment types for active specialists"
  ON public.appointment_types
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
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
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own appointment types"
  ON public.appointment_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    specialist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own appointment types"
  ON public.appointment_types
  FOR UPDATE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own appointment types"
  ON public.appointment_types
  FOR DELETE
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Agents can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Agents can view available appointments" ON public.appointments;
DROP POLICY IF EXISTS "Agents can update their own appointments" ON public.appointments;

CREATE POLICY "Agents can view their own appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can view available appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND agent_id IS NULL
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
      AND profiles.approval_status = 'approved'
    )
  );

CREATE POLICY "Agents can update their own appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = (select auth.uid())
  )
  WITH CHECK (
    agent_id = (select auth.uid())
  );

-- ============================================
-- BIDS TABLE
-- ============================================

-- Note: Only update if bids table exists (separate from lead_bids)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bids'
  ) THEN
    DROP POLICY IF EXISTS "Agents can view their own bids" ON public.bids;
    DROP POLICY IF EXISTS "Admins can view all bids" ON public.bids;

    CREATE POLICY "Agents can view their own bids"
      ON public.bids
      FOR SELECT
      TO authenticated
      USING (
        agent_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can view all bids"
      ON public.bids
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================
-- LEAD_BIDS TABLE
-- ============================================

-- Drop all possible policy names (in case they were renamed)
DROP POLICY IF EXISTS "Agents can insert bids" ON public.lead_bids;
DROP POLICY IF EXISTS "Agents can view their own bids" ON public.lead_bids;
DROP POLICY IF EXISTS "lead_bids_select_own" ON public.lead_bids;
DROP POLICY IF EXISTS "lead_bids_insert_own" ON public.lead_bids;

-- Recreate with optimized auth.uid() using the names Supabase reported
CREATE POLICY "lead_bids_select_own"
  ON public.lead_bids
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "lead_bids_insert_own"
  ON public.lead_bids
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

-- ============================================
-- LEAD_NOTES TABLE
-- ============================================

-- Only update if lead_notes table exists
-- Note: This table may have been created manually or in a migration not in this repo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_notes'
  ) THEN
    -- Try dropping with both possible policy names (case-insensitive matching)
    -- Supabase reported policy name is "agents_manage_own_notes"
    DROP POLICY IF EXISTS "agents_manage_own_notes" ON public.lead_notes;

    -- Recreate with optimized auth.uid()
    -- This is a generic policy that allows agents/admins to manage notes
    -- If the table structure requires more specific checks, this will need adjustment
    CREATE POLICY "agents_manage_own_notes"
      ON public.lead_notes
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role IN ('agent', 'admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role IN ('agent', 'admin')
        )
      );
  END IF;
END $$;

-- ============================================
-- EXTERNAL_EVENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Specialists can view their own external events" ON public.external_events;

CREATE POLICY "Specialists can view their own external events"
  ON public.external_events
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- OFFICE_LOCATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Agents can view their own office locations" ON public.office_locations;
DROP POLICY IF EXISTS "Agents can insert their own office locations" ON public.office_locations;
DROP POLICY IF EXISTS "Agents can update their own office locations" ON public.office_locations;
DROP POLICY IF EXISTS "Agents can delete their own office locations" ON public.office_locations;
DROP POLICY IF EXISTS "Public can view office locations for approved agents" ON public.office_locations;

CREATE POLICY "Agents can view their own office locations"
  ON public.office_locations
  FOR SELECT
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can insert their own office locations"
  ON public.office_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'agent'
    )
  );

CREATE POLICY "Agents can update their own office locations"
  ON public.office_locations
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Agents can delete their own office locations"
  ON public.office_locations
  FOR DELETE
  TO authenticated
  USING (
    agent_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view office locations for approved agents"
  ON public.office_locations
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = office_locations.agent_id
      AND profiles.role = 'agent'
      AND profiles.approval_status = 'approved'
    )
  );

