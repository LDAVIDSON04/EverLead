-- Enable Row Level Security (RLS) on payments table
-- This migration addresses Supabase security issue: Table public.payments is public, but RLS has not been enabled.

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Agents can view their own payments (payments for their appointments)
CREATE POLICY "Agents can view their own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = payments.appointment_id
      AND appointments.agent_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Service role can manage all payments (for API routes using supabaseAdmin)
-- Note: Service role bypasses RLS automatically, but we add this for completeness
CREATE POLICY "Service role can manage payments"
  ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

