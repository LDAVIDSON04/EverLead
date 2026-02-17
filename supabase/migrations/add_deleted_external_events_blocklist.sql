-- Blocklist for external calendar event IDs that the user deleted.
-- When we delete an event (agent-created or external), we record (specialist_id, provider, provider_event_id)
-- here so sync never re-imports it and the schedule API never shows it again.
CREATE TABLE IF NOT EXISTS public.deleted_external_event_sync_blocklist (
  specialist_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_event_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (specialist_id, provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_deleted_external_event_blocklist_specialist
  ON public.deleted_external_event_sync_blocklist(specialist_id);

COMMENT ON TABLE public.deleted_external_event_sync_blocklist IS 'Event IDs deleted by the user; sync must not re-import these and schedule must not show them';

ALTER TABLE public.deleted_external_event_sync_blocklist ENABLE ROW LEVEL SECURITY;

-- Agents can read their own blocklist (for schedule API filtering)
CREATE POLICY "Agents can read own blocklist"
  ON public.deleted_external_event_sync_blocklist
  FOR SELECT
  TO authenticated
  USING (specialist_id = auth.uid());

-- Inserts/updates only via service role (from API when user deletes an event)
CREATE POLICY "Service role can manage blocklist"
  ON public.deleted_external_event_sync_blocklist
  FOR ALL
  USING (true)
  WITH CHECK (true);
