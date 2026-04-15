-- Events when visitors use Contact me (reveal) or tap phone/email on contact-only marketplace listings.
-- Written via service role from API only; read via admin API only.

CREATE TABLE IF NOT EXISTS public.marketplace_contact_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  agent_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('reveal', 'phone', 'email')),
  source text NOT NULL DEFAULT 'search' CHECK (source IN ('search', 'agent_profile'))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_contact_events_agent_id
  ON public.marketplace_contact_request_events (agent_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_contact_events_created_at
  ON public.marketplace_contact_request_events (created_at DESC);

ALTER TABLE public.marketplace_contact_request_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.marketplace_contact_request_events IS 'Marketplace contact-only: reveal / phone / email taps (admin reporting).';
