-- Create email_queue table for scalable email sending
-- This allows us to queue emails and process them in the background
-- without hitting Vercel function timeouts

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_email text NOT NULL,
  agent_name text,
  city text NOT NULL,
  province text NOT NULL,
  urgency text NOT NULL,
  price text NOT NULL,
  lead_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_lead_id ON public.email_queue(lead_id);

-- Add comment
COMMENT ON TABLE public.email_queue IS 'Queue for agent email notifications. Allows processing thousands of emails without hitting function timeouts.';

