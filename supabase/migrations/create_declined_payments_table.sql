-- Create declined_payments table to track payment failures
CREATE TABLE IF NOT EXISTS public.declined_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  decline_reason TEXT,
  stripe_error_code TEXT,
  stripe_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL,
  resolved_payment_intent_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_declined_payments_agent_id ON declined_payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_declined_payments_appointment_id ON declined_payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_declined_payments_status ON declined_payments(status);
CREATE INDEX IF NOT EXISTS idx_declined_payments_created_at ON declined_payments(created_at);

-- Enable RLS
ALTER TABLE declined_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can view their own declined payments
CREATE POLICY "Agents can view their own declined payments"
ON declined_payments
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

-- Service role can do everything (for API routes using supabaseAdmin)
CREATE POLICY "Service role can manage declined payments"
ON declined_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

