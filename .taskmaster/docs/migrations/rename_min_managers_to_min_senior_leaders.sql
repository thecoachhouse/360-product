-- Rename min_managers column to min_senior_leaders in programmes table
-- This aligns the terminology with the relationship_type naming in nominations table

ALTER TABLE programmes 
RENAME COLUMN min_managers TO min_senior_leaders;

-- Add comment to document the column
COMMENT ON COLUMN programmes.min_senior_leaders IS 'Minimum number of senior leaders required for nominations';

