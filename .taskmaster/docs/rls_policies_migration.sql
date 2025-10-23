-- ============================================================================
-- RLS Policies Migration for Turning Point 360 Assessment Platform
-- ============================================================================
-- Purpose: Enable Row-Level Security (RLS) and create policies for all tables
-- to enforce proper access control based on user roles (admin, coachee, nominee)
-- 
-- Roles:
--   - admin: Full access to all data
--   - coachee: Access to own assessment data
--   - nominee: Access only to specific assessment they're invited to complete
--   - anonymous: Read-only access to public reference data (dimensions, competencies)
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all public tables
-- ============================================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coachees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculated_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create helper functions for role checking
-- ============================================================================

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's coachee_id (if they are a coachee)
CREATE OR REPLACE FUNCTION public.get_current_coachee_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.coachees
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a nominee for a specific coachee
CREATE OR REPLACE FUNCTION public.is_nominee_for_coachee(coachee_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.nominations n
    INNER JOIN public.nominees nom ON n.nominee_id = nom.id
    WHERE n.coachee_id = coachee_uuid
    AND nom.email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create RLS Policies for Reference Data Tables
-- These tables are read-only for authenticated users, write for admins only
-- ============================================================================

-- CLIENTS TABLE
CREATE POLICY "Admins have full access to clients"
  ON public.clients FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

-- PROGRAMMES TABLE
CREATE POLICY "Admins have full access to programmes"
  ON public.programmes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view programmes"
  ON public.programmes FOR SELECT
  USING (auth.role() = 'authenticated');

-- DIMENSIONS TABLE (public reference data)
CREATE POLICY "Admins have full access to dimensions"
  ON public.dimensions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view dimensions"
  ON public.dimensions FOR SELECT
  USING (true);

-- COMPETENCIES TABLE (public reference data)
CREATE POLICY "Admins have full access to competencies"
  ON public.competencies FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view competencies"
  ON public.competencies FOR SELECT
  USING (true);

-- QUESTIONS TABLE (assessment configuration)
CREATE POLICY "Admins have full access to questions"
  ON public.questions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view questions"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ASSESSMENT_TEMPLATES TABLE
CREATE POLICY "Admins have full access to assessment templates"
  ON public.assessment_templates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view assessment templates"
  ON public.assessment_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 4: Create RLS Policies for User Data Tables
-- ============================================================================

-- COACHEES TABLE
CREATE POLICY "Admins have full access to coachees"
  ON public.coachees FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Coachees can view their own data"
  ON public.coachees FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Coachees can update their own data"
  ON public.coachees FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- NOMINEES TABLE
CREATE POLICY "Admins have full access to nominees"
  ON public.nominees FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Nominees can view their own data"
  ON public.nominees FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- NOMINATIONS TABLE
CREATE POLICY "Admins have full access to nominations"
  ON public.nominations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Coachees can view their own nominations"
  ON public.nominations FOR SELECT
  USING (coachee_id = auth.uid());

CREATE POLICY "Coachees can create nominations"
  ON public.nominations FOR INSERT
  WITH CHECK (coachee_id = auth.uid());

CREATE POLICY "Nominees can view nominations where they are the nominee"
  ON public.nominations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nominees
      WHERE nominees.id = nominations.nominee_id
      AND nominees.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- STEP 5: Create RLS Policies for Assessment Data Tables
-- ============================================================================

-- ASSESSMENT_RESPONSES TABLE
CREATE POLICY "Admins have full access to assessment responses"
  ON public.assessment_responses FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can insert their own responses"
  ON public.assessment_responses FOR INSERT
  WITH CHECK (
    -- Allow if user is the coachee (self-assessment)
    coachee_id = auth.uid()
    OR
    -- Allow if user is a nominee for this coachee
    respondent_email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Coachees can view responses for their assessments (anonymized)"
  ON public.assessment_responses FOR SELECT
  USING (
    coachee_id = auth.uid()
    AND is_admin() = false -- Prevent showing respondent_email to coachees
  );

CREATE POLICY "Nominees can view their own submitted responses"
  ON public.assessment_responses FOR SELECT
  USING (respondent_email = auth.jwt() ->> 'email');

-- CALCULATED_SCORES TABLE
CREATE POLICY "Admins have full access to calculated scores"
  ON public.calculated_scores FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Coachees can view their own calculated scores"
  ON public.calculated_scores FOR SELECT
  USING (coachee_id = auth.uid());

-- Note: Only admins can insert/update/delete calculated scores
-- This ensures data integrity of processed results

-- ============================================================================
-- STEP 6: Grant necessary permissions to authenticated role
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on reference tables to authenticated users
GRANT SELECT ON public.dimensions TO authenticated, anon;
GRANT SELECT ON public.competencies TO authenticated, anon;

-- Grant appropriate permissions on other tables
GRANT SELECT, INSERT ON public.assessment_responses TO authenticated;
GRANT SELECT ON public.coachees TO authenticated;
GRANT SELECT ON public.nominees TO authenticated;
GRANT SELECT ON public.nominations TO authenticated;
GRANT SELECT ON public.assessment_templates TO authenticated;
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.calculated_scores TO authenticated;

-- ============================================================================
-- STEP 7: Create secure views with proper RLS enforcement
-- ============================================================================

-- Drop existing SECURITY DEFINER views and recreate with proper permissions
DROP VIEW IF EXISTS public.coachee_details CASCADE;
DROP VIEW IF EXISTS public.nomination_details CASCADE;
DROP VIEW IF EXISTS public.dimension_scores CASCADE;

-- Coachee Details View (respects RLS)
CREATE VIEW public.coachee_details AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.created_at,
  p.name as programme_name,
  cl.name as client_name
FROM public.coachees c
LEFT JOIN public.programmes p ON c.programme_id = p.id
LEFT JOIN public.clients cl ON p.client_id = cl.id;

-- Apply RLS to the view
ALTER VIEW public.coachee_details SET (security_invoker = true);

-- Nomination Details View (respects RLS)
CREATE VIEW public.nomination_details AS
SELECT 
  n.id,
  n.coachee_id,
  c.full_name as coachee_name,
  n.nominee_id,
  nom.full_name as nominee_name,
  nom.email as nominee_email,
  n.relationship_type,
  n.created_at
FROM public.nominations n
INNER JOIN public.coachees c ON n.coachee_id = c.id
INNER JOIN public.nominees nom ON n.nominee_id = nom.id;

-- Apply RLS to the view
ALTER VIEW public.nomination_details SET (security_invoker = true);

-- Dimension Scores View (respects RLS)
CREATE VIEW public.dimension_scores AS
SELECT 
  cs.coachee_id,
  d.name as dimension_name,
  cs.relationship_type,
  AVG(cs.average_score) as dimension_average
FROM public.calculated_scores cs
INNER JOIN public.competencies comp ON cs.competency_id = comp.id
INNER JOIN public.dimensions d ON comp.dimension_id = d.id
GROUP BY cs.coachee_id, d.id, d.name, cs.relationship_type;

-- Apply RLS to the view
ALTER VIEW public.dimension_scores SET (security_invoker = true);

-- ============================================================================
-- STEP 8: Create indexes for performance optimization
-- ============================================================================

-- Index for faster RLS policy checks
CREATE INDEX IF NOT EXISTS idx_coachees_auth_uid ON public.coachees(id);
CREATE INDEX IF NOT EXISTS idx_nominees_email ON public.nominees(email);
CREATE INDEX IF NOT EXISTS idx_nominations_coachee_id ON public.nominations(coachee_id);
CREATE INDEX IF NOT EXISTS idx_nominations_nominee_id ON public.nominations(nominee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_coachee_id ON public.assessment_responses(coachee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_respondent_email ON public.assessment_responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_calculated_scores_coachee_id ON public.calculated_scores(coachee_id);

-- ============================================================================
-- STEP 9: Testing queries (run these after applying migration)
-- ============================================================================

-- Test 1: Verify RLS is enabled
/*
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
*/

-- Test 2: View all policies
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- Test 3: Test as admin (set user_metadata.role = 'admin')
/*
SELECT * FROM public.coachees;
SELECT * FROM public.assessment_responses;
*/

-- Test 4: Test as coachee (auth.uid() should match coachee.id)
/*
SELECT * FROM public.coachees WHERE id = auth.uid();
SELECT * FROM public.nominations WHERE coachee_id = auth.uid();
*/

-- Test 5: Test as nominee (check email match)
/*
SELECT * FROM public.nominations n
INNER JOIN public.nominees nom ON n.nominee_id = nom.id
WHERE nom.email = auth.jwt() ->> 'email';
*/

-- ============================================================================
-- NOTES FOR IMPLEMENTATION:
-- ============================================================================
-- 1. Apply this migration via Supabase MCP tool: mcp_supabase_apply_migration
-- 2. Create admin users and set user_metadata.role = 'admin' in Supabase dashboard
-- 3. Test each policy with different user roles before going to production
-- 4. Monitor query performance with new RLS policies using pg_stat_statements
-- 5. Consider creating additional policies for specific use cases as needed
-- 6. Update n8n webhook to authenticate requests properly
-- ============================================================================

