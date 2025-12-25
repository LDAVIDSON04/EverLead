-- Add webhook fields to calendar_connections table for real-time sync

DO $$ 
BEGIN
  -- Add webhook_channel_id for Google Calendar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'calendar_connections' 
      AND column_name = 'webhook_channel_id'
  ) THEN
    ALTER TABLE public.calendar_connections ADD COLUMN webhook_channel_id text;
    COMMENT ON COLUMN public.calendar_connections.webhook_channel_id IS 'Google Calendar webhook channel ID';
  END IF;
  
  -- Add webhook_resource_id for Google Calendar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'calendar_connections' 
      AND column_name = 'webhook_resource_id'
  ) THEN
    ALTER TABLE public.calendar_connections ADD COLUMN webhook_resource_id text;
    COMMENT ON COLUMN public.calendar_connections.webhook_resource_id IS 'Google Calendar webhook resource ID';
  END IF;
  
  -- Add webhook_subscription_id for Microsoft Calendar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'calendar_connections' 
      AND column_name = 'webhook_subscription_id'
  ) THEN
    ALTER TABLE public.calendar_connections ADD COLUMN webhook_subscription_id text;
    COMMENT ON COLUMN public.calendar_connections.webhook_subscription_id IS 'Microsoft Calendar webhook subscription ID';
  END IF;
  
  -- Add webhook_expires_at for both providers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'calendar_connections' 
      AND column_name = 'webhook_expires_at'
  ) THEN
    ALTER TABLE public.calendar_connections ADD COLUMN webhook_expires_at timestamptz;
    COMMENT ON COLUMN public.calendar_connections.webhook_expires_at IS 'When the webhook subscription expires (needs renewal)';
  END IF;
END $$;

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_webhook_channel 
  ON public.calendar_connections(webhook_channel_id) 
  WHERE webhook_channel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_connections_webhook_subscription 
  ON public.calendar_connections(webhook_subscription_id) 
  WHERE webhook_subscription_id IS NOT NULL;

