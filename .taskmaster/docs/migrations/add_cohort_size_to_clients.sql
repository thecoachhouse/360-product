-- Migration: Add cohort_size column to clients table
-- Date: 2025-10-23
-- Purpose: Track expected cohort size at the client level for planning purposes

-- Add cohort_size column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS cohort_size INTEGER;

-- Add comment to document the column
COMMENT ON COLUMN clients.cohort_size IS 'Expected cohort size for coaching programmes with this client';

