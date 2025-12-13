-- Soradin Database Schema
-- Supports appointments, availability, and external calendar sync (Google, Microsoft, ICS)

-- Enums (only create if they don't exist)
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE calendar_provider AS ENUM (
    'google',
    'microsoft',
    'ics'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Specialists
CREATE TABLE IF NOT EXISTS specialists (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  location_city text,
  location_region text,
  timezone text NOT NULL DEFAULT 'America/Edmonton',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE specialists IS 'Funeral specialists who can be booked by families';
COMMENT ON COLUMN specialists.timezone IS 'IANA timezone identifier (e.g., America/Edmonton)';

-- Families
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE families IS 'Families seeking pre-need funeral planning services';

-- Appointment Types
CREATE TABLE IF NOT EXISTS appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes int NOT NULL,
  price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE appointment_types IS 'Types of appointments a specialist offers (e.g., consultation, planning session)';

-- Specialist Availability
CREATE TABLE IF NOT EXISTS specialist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_interval_minutes int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, weekday)
);

COMMENT ON TABLE specialist_availability IS 'Weekly recurring availability templates (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN specialist_availability.weekday IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN specialist_availability.slot_interval_minutes IS 'Time slot granularity (e.g., 30 for 30-minute slots)';

-- Specialist Time Off
CREATE TABLE IF NOT EXISTS specialist_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

COMMENT ON TABLE specialist_time_off IS 'Blocked time periods (vacations, holidays, personal time)';

-- Calendar Connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  external_calendar_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  ics_secret text,
  sync_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, provider)
);

COMMENT ON TABLE calendar_connections IS 'OAuth connections to external calendars (Google, Microsoft) or ICS feed configs';
COMMENT ON COLUMN calendar_connections.external_calendar_id IS 'Google Calendar ID or Microsoft Calendar ID';
COMMENT ON COLUMN calendar_connections.ics_secret IS 'Secret token for read-only ICS feed URL (provider=ics)';
COMMENT ON COLUMN calendar_connections.sync_enabled IS 'Whether two-way sync is active for this connection';

-- Appointments (only create if table doesn't exist with old structure)
-- Check if appointments table exists with old structure (lead_id) or new structure (specialist_id)
DO $$ 
BEGIN
  -- Only create new appointments table if:
  -- 1. Table doesn't exist at all, OR
  -- 2. Table exists but has specialist_id (new structure already exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments'
  ) THEN
    -- Table doesn't exist, create it with new structure
    EXECUTE '
    CREATE TABLE public.appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
      family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
      appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE RESTRICT,
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      status appointment_status NOT NULL DEFAULT ''pending'',
      notes text,
      external_event_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (ends_at > starts_at)
    )';
    
    COMMENT ON TABLE public.appointments IS 'Booked appointments between families and specialists';
    COMMENT ON COLUMN public.appointments.external_event_id IS 'FK to external_events.id when this appointment is synced to an external calendar';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'lead_id'
  ) THEN
    -- Table exists with old structure (lead_id), skip creating new structure
    RAISE NOTICE 'Appointments table already exists with old structure (lead_id), skipping new structure creation';
  END IF;
END $$;

-- External Events (create with conditional appointment_id reference)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'external_events'
  ) THEN
    -- Check if appointments table has new structure (specialist_id) or old structure (lead_id)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'specialist_id'
    ) THEN
      -- New structure exists, create with appointment_id foreign key
      EXECUTE '
      CREATE TABLE public.external_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
        provider calendar_provider NOT NULL CHECK (provider IN (''google'', ''microsoft'')),
        provider_event_id text NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        is_all_day boolean NOT NULL DEFAULT false,
        status text,
        is_soradin_created boolean NOT NULL DEFAULT false,
        appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
        raw_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(specialist_id, provider, provider_event_id),
        CHECK (ends_at > starts_at)
      )';
    ELSE
      -- Old structure or no appointments table, create without appointment_id foreign key
      EXECUTE '
      CREATE TABLE public.external_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
        provider calendar_provider NOT NULL CHECK (provider IN (''google'', ''microsoft'')),
        provider_event_id text NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        is_all_day boolean NOT NULL DEFAULT false,
        status text,
        is_soradin_created boolean NOT NULL DEFAULT false,
        appointment_id uuid,
        raw_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(specialist_id, provider, provider_event_id),
        CHECK (ends_at > starts_at)
      )';
    END IF;
    
    COMMENT ON TABLE public.external_events IS 'Events from external calendars (Google/Microsoft) used for busy-time detection and two-way sync';
    COMMENT ON COLUMN public.external_events.is_soradin_created IS 'True if this event was created by Soradin from an appointment';
    COMMENT ON COLUMN public.external_events.appointment_id IS 'Links to appointments table when this external event mirrors a Soradin appointment';
    COMMENT ON COLUMN public.external_events.raw_payload IS 'Full event JSON from provider API for debugging and future use';
  END IF;
END $$;

-- Add external_event_id column to appointments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'external_event_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN external_event_id uuid;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already exist or table might not exist, ignore
    NULL;
END $$;

-- Add foreign key from appointments to external_events (only if constraint doesn't exist)
-- First ensure the column exists and external_events table exists
DO $$ 
BEGIN
  -- Check if column exists and external_events table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'external_event_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'external_events'
  ) THEN
    -- Try to add the constraint
    BEGIN
      ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_external_event_id_fkey 
        FOREIGN KEY (external_event_id) REFERENCES public.external_events(id) ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN
        -- Constraint already exists, that's fine
        NULL;
      WHEN OTHERS THEN
        -- Other errors, re-raise
        RAISE;
    END;
  END IF;
END $$;

-- Payments (only create if new appointments structure exists)
DO $$ 
BEGIN
  -- Only create payments table if appointments table has specialist_id (new structure)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'specialist_id'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
      stripe_payment_intent_id text UNIQUE,
      amount_cents int NOT NULL,
      currency text NOT NULL DEFAULT 'CAD',
      status text NOT NULL CHECK (status IN ('requires_payment', 'succeeded', 'refunded', 'failed')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    COMMENT ON TABLE public.payments IS 'Payment records for appointments via Stripe';
  END IF;
END $$;

-- Indexes for performance (only create if new appointments table structure exists)
DO $$ 
BEGIN
  -- Only create indexes if appointments table has specialist_id (new structure)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'specialist_id'
  ) THEN
    -- Use EXECUTE to defer validation until runtime
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_appointments_specialist_id ON public.appointments(specialist_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_appointments_specialist_starts_at ON public.appointments(specialist_id, starts_at)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_appointments_family_id ON public.appointments(family_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON public.appointments(starts_at)';
  END IF;
  
  -- Status index can be created for both old and new structures (both have status column)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'appointments'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_external_events_specialist_id ON external_events(specialist_id);
CREATE INDEX IF NOT EXISTS idx_external_events_specialist_starts_at ON external_events(specialist_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_external_events_provider_event_id ON external_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_external_events_appointment_id ON external_events(appointment_id);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_specialist_id ON calendar_connections(specialist_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_specialist_provider ON calendar_connections(specialist_id, provider);

CREATE INDEX IF NOT EXISTS idx_specialist_availability_specialist_id ON specialist_availability(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_time_off_specialist_id ON specialist_time_off(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_time_off_dates ON specialist_time_off(specialist_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_appointment_types_specialist_id ON appointment_types(specialist_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specialists_updated_at BEFORE UPDATE ON specialists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_types_updated_at BEFORE UPDATE ON appointment_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_availability_updated_at BEFORE UPDATE ON specialist_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_time_off_updated_at BEFORE UPDATE ON specialist_time_off
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only create appointments trigger if new structure exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'appointments' 
      AND column_name = 'specialist_id'
  ) THEN
    DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
    CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE TRIGGER update_calendar_connections_updated_at BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_events_updated_at BEFORE UPDATE ON external_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only create payments trigger if payments table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'payments'
  ) THEN
    DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
    CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

