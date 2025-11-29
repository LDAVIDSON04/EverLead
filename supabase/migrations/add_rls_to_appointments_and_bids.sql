-- Migration: Enable RLS on appointments and bids tables
-- This addresses Supabase security alerts

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can view appointments they own (agent_id matches)
CREATE POLICY "Agents can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  agent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Agents can view pending appointments (for buying)
CREATE POLICY "Agents can view available appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND agent_id IS NULL
  AND is_hidden = false
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
    AND profiles.approval_status = 'approved'
  )
);

-- Policy: Agents can update their own appointments (status updates)
CREATE POLICY "Agents can update their own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  agent_id = auth.uid()
)
WITH CHECK (
  agent_id = auth.uid()
);

-- Policy: Service role (supabaseAdmin) bypasses RLS automatically
-- No policy needed - service role has full access

-- ============================================
-- BIDS TABLE (if it exists separately from lead_bids)
-- ============================================

-- Check if bids table exists (it might be lead_bids instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bids'
  ) THEN
    -- Enable RLS on bids
    ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

    -- Policy: Agents can view their own bids
    CREATE POLICY "Agents can view their own bids"
    ON public.bids
    FOR SELECT
    TO authenticated
    USING (
      agent_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );

    -- Policy: Admins can view all bids
    CREATE POLICY "Admins can view all bids"
    ON public.bids
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- Note: lead_bids table already has RLS enabled (from add_auction_fields.sql)

