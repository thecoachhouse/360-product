-- Migration: Add programme_id and template_type to assessment_templates
-- Date: 2025-10-23
-- Purpose: Link assessment templates to programmes and differentiate between self/peer assessments

-- Add new columns
ALTER TABLE public.assessment_templates 
ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES public.programmes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('self', 'peer', 'manager'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_assessment_templates_programme 
ON public.assessment_templates(programme_id, template_type);

-- Update RLS policies to allow programme-based access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "assessment_templates_select_policy" ON public.assessment_templates;
DROP POLICY IF EXISTS "assessment_templates_insert_policy" ON public.assessment_templates;
DROP POLICY IF EXISTS "assessment_templates_update_policy" ON public.assessment_templates;
DROP POLICY IF EXISTS "assessment_templates_delete_policy" ON public.assessment_templates;

-- Admins can do everything
CREATE POLICY "assessment_templates_admin_all_policy" ON public.assessment_templates
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Coachees can view templates for their programme
CREATE POLICY "assessment_templates_coachee_select_policy" ON public.assessment_templates
FOR SELECT
TO authenticated
USING (
  programme_id IN (
    SELECT programme_id FROM public.coachees 
    WHERE id = auth.uid()
  )
);

-- Nominees can view templates for programmes they're assessing
CREATE POLICY "assessment_templates_nominee_select_policy" ON public.assessment_templates
FOR SELECT
TO authenticated
USING (
  programme_id IN (
    SELECT c.programme_id 
    FROM public.nominations n
    JOIN public.coachees c ON n.coachee_id = c.id
    JOIN public.nominees nom ON n.nominee_id = nom.id
    WHERE nom.email = auth.jwt() ->> 'email'
  )
);

-- Add comments for documentation
COMMENT ON COLUMN public.assessment_templates.programme_id IS 'Links template to a specific programme';
COMMENT ON COLUMN public.assessment_templates.template_type IS 'Type of assessment: self (coachee), peer (nominee), or manager';

