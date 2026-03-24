-- =============================================
-- KIROS AI VOICE ASSISTANT — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================

-- Clients (mirrors the Customer Database Google Sheet)
CREATE TABLE IF NOT EXISTS clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        TEXT,
  last_name         TEXT,
  phone_number      TEXT UNIQUE NOT NULL,
  email             TEXT,
  disc_profile      TEXT,
  zoom_meeting      TEXT,                          -- last booked zoom datetime
  objective_1       TEXT,                          -- col G: original objective
  objective_2       TEXT,                          -- col H: new client objective
  objective_3       TEXT,                          -- col I: second objective
  objective_4       TEXT,                          -- col J: third objective
  sheets_row        INTEGER,                       -- tracks row in Google Sheet
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Call logs
CREATE TABLE IF NOT EXISTS calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id      TEXT UNIQUE,
  client_id         UUID REFERENCES clients(id),
  phone_number      TEXT NOT NULL,                 -- always store raw number
  caller_type       TEXT DEFAULT 'new',            -- 'returning' | 'new'
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER,
  ended_reason      TEXT,
  transcript        TEXT,
  summary           TEXT,
  success_eval      TEXT,
  recording_url     TEXT,
  cost_cents        INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id           UUID REFERENCES calls(id),
  client_id         UUID REFERENCES clients(id),
  booking_type      TEXT NOT NULL,                 -- 'schedule' | 'reschedule' | 'cancel'
  appointment_type  TEXT DEFAULT 'Zoom Meeting',
  scheduled_at      TIMESTAMPTZ,
  email             TEXT,
  status            TEXT DEFAULT 'active',         -- 'active' | 'cancelled' | 'completed'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_phone   ON clients(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_client    ON calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_created   ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Auto-update updated_at on clients
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Settings (editable config — system prompts, available times, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
