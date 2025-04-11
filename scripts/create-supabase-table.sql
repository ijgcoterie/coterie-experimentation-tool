-- This script creates the experiments table in Supabase
-- Run this in the Supabase SQL Editor to set up your database

-- Create experiments table
CREATE TABLE IF NOT EXISTS public.experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  targeting JSONB NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  statsig_id TEXT,
  statsig_layer TEXT,
  is_from_statsig BOOLEAN DEFAULT FALSE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS experiments_status_idx ON public.experiments(status);
CREATE INDEX IF NOT EXISTS experiments_updated_at_idx ON public.experiments(updated_at DESC);
CREATE INDEX IF NOT EXISTS experiments_statsig_id_idx ON public.experiments(statsig_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you would want to restrict this based on user roles
CREATE POLICY "Allow all operations" ON public.experiments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to authenticated and anon users
GRANT ALL ON public.experiments TO authenticated;
GRANT ALL ON public.experiments TO anon;