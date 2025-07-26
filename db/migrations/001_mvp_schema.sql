-- MVP Database Schema Migration
-- This migration updates the database schema to match the MVP PRD requirements

-- Drop existing tables
DROP TABLE IF EXISTS job_logs;
DROP TABLE IF EXISTS jobs;

-- Create new jobs table per MVP PRD Section 6
CREATE TABLE jobs (
  id          UUID PRIMARY KEY,
  command     TEXT                       NOT NULL,
  type        TEXT CHECK (type IN ('stream','terminal','ssh')),
  status      TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  exit_code   INTEGER
);

-- Create new job_events table (renamed from job_logs)
CREATE TABLE job_events (
  id       BIGSERIAL PRIMARY KEY,
  job_id   UUID REFERENCES jobs(id) ON DELETE CASCADE,
  ts       TIMESTAMPTZ DEFAULT NOW(),
  stream   TEXT,       -- stdout | stderr | system
  chunk    TEXT
);

-- Create indexes for performance
CREATE INDEX idx_job_events_job_id_ts ON job_events(job_id, ts);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_started_at ON jobs(started_at);

-- Insert some sample data for testing
INSERT INTO jobs (id, command, type, status, started_at, finished_at, exit_code) VALUES
  (gen_random_uuid(), 'echo "Sample completed job"', 'stream', 'success', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', 0),
  (gen_random_uuid(), 'echo "Sample failed job"', 'stream', 'failed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes', 1),
  (gen_random_uuid(), 'make vm status', 'terminal', 'spawned', NOW() - INTERVAL '10 minutes', NULL, NULL);
