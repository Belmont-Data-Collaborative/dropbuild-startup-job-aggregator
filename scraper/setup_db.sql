-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gdqfekecdtkiwwmyjwfz/sql

-- Drop old schema from previous builds
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS pipeline_runs CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;

-- Jobs table
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_url text NOT NULL DEFAULT '',
  company text NOT NULL,
  role_title text NOT NULL,
  listing_url text NOT NULL,
  url_hash text NOT NULL,
  date_posted date,
  date_scraped timestamptz NOT NULL DEFAULT now(),
  week_key text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_filtered_in boolean NOT NULL DEFAULT false,
  raw_snippet text,
  UNIQUE(url_hash, week_key)
);

-- Pipeline runs table
CREATE TABLE pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date timestamptz NOT NULL DEFAULT now(),
  total_scraped integer NOT NULL DEFAULT 0,
  new_listings integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  filtered_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors_json jsonb
);

-- App config table (key-value store)
CREATE TABLE app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

-- RLS: allow anon reads (dashboard is public)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read jobs" ON jobs FOR SELECT TO anon USING (true);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read pipeline_runs" ON pipeline_runs FOR SELECT TO anon USING (true);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read app_config" ON app_config FOR SELECT TO anon USING (true);

-- Useful index for week-based queries
CREATE INDEX jobs_week_key_idx ON jobs(week_key);
CREATE INDEX jobs_is_filtered_idx ON jobs(is_filtered_in);
