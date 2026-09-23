-- PEARD Migration M-001
-- Run this in your Vercel Postgres / Neon Query tab AFTER the base schema.sql
-- All statements are idempotent (safe to re-run)

-- Issue 1: Server-side round state machine
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS round_ends_at TIMESTAMP;

-- Issue 3: Age/DOB enforcement
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Issue 7: OTP rate limiting
CREATE TABLE IF NOT EXISTS otp_rate_limit (
  phone_number VARCHAR(20) PRIMARY KEY,
  send_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW()
);

ALTER TABLE otp_verification
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
