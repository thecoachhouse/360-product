-- Migration: Add 'onboarding' to template_type check constraint
-- Date: 2025-01-XX
-- Purpose: Allow onboarding assessment templates in addition to self, peer, and manager

-- First, drop the existing check constraint
ALTER TABLE public.assessment_templates 
DROP CONSTRAINT IF EXISTS assessment_templates_template_type_check;

-- Recreate the constraint with 'onboarding' included
ALTER TABLE public.assessment_templates 
ADD CONSTRAINT assessment_templates_template_type_check 
CHECK (template_type IN ('self', 'peer', 'manager', 'onboarding'));

-- Update the comment to reflect the change
COMMENT ON COLUMN public.assessment_templates.template_type IS 'Type of assessment: self (coachee), peer (nominee), manager, or onboarding';

